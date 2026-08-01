using AutoMapper;
using Shared.Exceptions;
using Entities.Models;
using Shared.RequestFeatures;
using Repository.Interfaces;
using Services.Cryptography;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace Services
{
    public class ChatService : IChatService
    {
        private readonly IRepositoryManager _repository;
        private readonly ILoggerManager _logger;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUser;
        private readonly IChatNotifier _notifier;
        private readonly IMessageCipher _cipher;

        public ChatService(IRepositoryManager repository, ILoggerManager logger, IMapper mapper,
            ICurrentUserService currentUser, IChatNotifier notifier, IMessageCipher cipher)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
            _currentUser = currentUser;
            _notifier = notifier;
            _cipher = cipher;
        }

        public async Task<(IEnumerable<ChatDto> chats, MetaData metaData)> GetAllAsync(ChatParameters chatParameters)
        {
            var allowedChatIds = await _repository.ChatMember.GetChatIdsForUserAsync(_currentUser.UserId);
            var chatsWithMetaData = await _repository.Chat.GetAllChatsAsync(chatParameters, allowedChatIds, trackChanges: false);
            var chatsDto = _mapper.Map<IEnumerable<ChatDto>>(chatsWithMetaData).ToList();
            var result = await ConvertDirectChatsAsync(chatsDto);
            result = await AttachLastMessagesAsync(result);
            result = await AttachUnreadCountsAsync(result);
            result = await HideClearedDirectChatsAsync(result);
            return (chats: result, metaData: chatsWithMetaData.MetaData);
        }

        public async Task<ChatDto> GetByIdAsync(int id)
        {
            var chat = await GetChatOrThrowAsync(id, trackChanges: false);
            await EnsureCallerIsChatMember(id);

            ChatDto dto;
            if (chat.IsPrivate)
            {
                var partners = await _repository.ChatMember.GetDirectChatPartnersAsync(
                    new[] { chat.Id }, _currentUser.UserId);
                partners.TryGetValue(chat.Id, out var partner);
                dto = MapToDirectChatDto(chat, partner);
            }
            else
            {
                dto = _mapper.Map<ChatDto>(chat);
            }

            return (await AttachUnreadCountsAsync([dto]))[0];
        }

        public async Task<ChatDto> CreateAsync(ChatForCreationDto chatDto)
        {
            var currentUserId = _currentUser.UserId;

            var memberIds = chatDto.Members
                .Select(m => m.UserId)
                .Where(id => id != currentUserId)
                .Distinct()
                .ToList();

            foreach (var userId in memberIds)
                await EnsureCanBeInvitedAsync(userId);

            var chat = _mapper.Map<Chat>(chatDto);
            chat.CreatorId = currentUserId;
            chat.IsPrivate = false;
            _repository.Chat.CreateChat(chat);
            await _repository.SaveAsync();

            AddMember(chat.Id, currentUserId, UserRole.Owner);
            foreach (var userId in memberIds)
                AddMember(chat.Id, userId, UserRole.User);

            await _repository.SaveAsync();

            var createdDto = _mapper.Map<ChatDto>(chat);
            await _notifier.ChatCreatedAsync(memberIds.Append(currentUserId), createdDto);
            return createdDto;
        }

        public async Task<DirectChatDto> CreateDirectChatAsync(int otherUserId)
        {
            var currentUserId = _currentUser.UserId;
            if (otherUserId == currentUserId)
                throw new DirectChatWithSelfException();

            var otherUser = await _repository.User.GetUserAsync(otherUserId, trackChanges: false);
            if (otherUser is null)
                throw new UserNotFoundException(otherUserId);

            if (await _repository.UserBlock.IsBlockedEitherWayAsync(currentUserId, otherUserId))
                throw new BlockedUserException();

            var existing = await _repository.Chat.GetPrivateChatBetweenAsync(currentUserId, otherUserId);
            if (existing is not null)
                return MapToDirectChatDto(existing, ToPartner(otherUser));

            await EnsurePrivacyAllowsAsync(otherUser.WhoCanMessage, otherUserId, "direct messages");

            var chat = new Chat
            {
                Name = null,
                CreatorId = currentUserId,
                IsPrivate = true
            };
            _repository.Chat.CreateChat(chat);
            await _repository.SaveAsync();

            AddMember(chat.Id, currentUserId, UserRole.User);
            AddMember(chat.Id, otherUserId, UserRole.User);
            await _repository.SaveAsync();

            var currentUser = await _repository.User.GetUserAsync(currentUserId, trackChanges: false);

            await _notifier.ChatCreatedAsync(new[] { currentUserId }, MapToDirectChatDto(chat, ToPartner(otherUser)));
            await _notifier.ChatCreatedAsync(new[] { otherUserId },
                MapToDirectChatDto(chat, currentUser is null ? null : ToPartner(currentUser)));

            return MapToDirectChatDto(chat, ToPartner(otherUser));
        }

        private DirectChatDto MapToDirectChatDto(Chat chat, DirectChatPartner? partner) =>
            MapToDirectChatDto(_mapper.Map<ChatDto>(chat), partner);

        private static DirectChatDto MapToDirectChatDto(ChatDto chat, DirectChatPartner? partner) =>
            new DirectChatDto
            {
                Id = chat.Id,
                Name = chat.Name,
                Description = chat.Description,
                WhoCanInvite = chat.WhoCanInvite,
                WhoCanEdit = chat.WhoCanEdit,
                WhoCanPost = chat.WhoCanPost,
                CreatorId = chat.CreatorId,
                IsPrivate = chat.IsPrivate,
                CreatedAt = chat.CreatedAt,
                LastMessageContent = chat.LastMessageContent,
                LastMessageSenderName = chat.LastMessageSenderName,
                LastMessageSenderId = chat.LastMessageSenderId,
                LastMessageAt = chat.LastMessageAt,
                UnreadCount = chat.UnreadCount,
                AvatarUpdatedAt = chat.AvatarUpdatedAt,
                PartnerUserName = partner?.UserName,
                PartnerUserId = partner?.UserId,
                PartnerAvatarUpdatedAt = partner?.AvatarUpdatedAt
            };

        private static DirectChatPartner ToPartner(User user) =>
            new DirectChatPartner
            {
                UserId = user.Id,
                UserName = user.UserName,
                AvatarUpdatedAt = user.AvatarUpdatedAt
            };

        public async Task DeleteAsync(int id)
        {
            var chat = await GetChatOrThrowAsync(id, trackChanges: false);

            if (chat.IsPrivate)
                await EnsureCallerIsChatMember(id, "delete this chat");
            else
                await EnsureCallerIsChatOwner(id, "delete this chat");

            var memberIds = await GetMemberIdsAsync(id);

            _repository.Chat.DeleteChat(chat);
            await _repository.SaveAsync();

            await _notifier.ChatDeletedAsync(memberIds, new ChatDeletedSignalrDto { ChatId = id });
        }

        public async Task UpdatePermissionsAsync(int id, ChatPermissionsDto permissions)
        {
            var chat = await GetChatOrThrowAsync(id, trackChanges: true);
            if (chat.IsPrivate)
                throw new OperationNotAllowedInPrivateChatException("change permissions");

            await EnsureCallerIsChatOwner(id, "change permissions");

            foreach (var level in new[]
                     { permissions.WhoCanInvite, permissions.WhoCanEdit, permissions.WhoCanPost })
            {
                if (!ChatPermission.IsDefined(level))
                    throw new InvalidChatPermissionException(level);
            }

            chat.WhoCanInvite = permissions.WhoCanInvite;
            chat.WhoCanEdit = permissions.WhoCanEdit;
            chat.WhoCanPost = permissions.WhoCanPost;
            await _repository.SaveAsync();
        }

        public async Task<int?> FindDirectChatIdAsync(int otherUserId)
        {
            var chat = await _repository.Chat.GetPrivateChatBetweenAsync(
                _currentUser.UserId, otherUserId);
            return chat?.Id;
        }

        public async Task ClearForCurrentUserAsync(int id)
        {
            var chat = await GetChatOrThrowAsync(id, trackChanges: false);
            if (!chat.IsPrivate)
                throw new OperationNotAllowedInGroupChatException("clear the chat for yourself");

            var member = await _repository.ChatMember.GetMemberAsync(
                id, _currentUser.UserId, trackChanges: true)
                ?? throw new ChatAccessDeniedException(id, _currentUser.UserId);

            member.ClearedAt = DateTime.UtcNow;
            await _repository.SaveAsync();
        }

        public async Task RenameAsync(int id, ChatForRenameDto chatDto)
        {
            var chat = await GetChatOrThrowAsync(id, trackChanges: true);
            if (chat.IsPrivate)
                throw new OperationNotAllowedInPrivateChatException("rename");
            await EnsureCallerIsAllowedAsync(chat, chat.WhoCanEdit, "rename this chat");
            chat.Name = chatDto.Name;
            chat.Description = string.IsNullOrWhiteSpace(chatDto.Description)
                ? null
                : chatDto.Description.Trim();
            await _repository.SaveAsync();

            var renamedDto = new ChatRenamedSignalrDto { ChatId = id, Name = chatDto.Name };
            await _notifier.ChatRenamedAsync(await GetMemberIdsAsync(id), renamedDto);
        }

        private async Task<List<int>> GetMemberIdsAsync(int chatId)
        {
            var members = await _repository.ChatMember.GetMembersByChatIdAsync(chatId, trackChanges: false);
            return members.Select(m => m.UserId).ToList();
        }

        private async Task<Chat> GetChatOrThrowAsync(int chatId, bool trackChanges)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            return chat;
        }

        private async Task<List<ChatDto>> ConvertDirectChatsAsync(List<ChatDto> chats)
        {
            var directChatIds = chats.Where(c => c.IsPrivate).Select(c => c.Id).ToList();
            if (directChatIds.Count == 0) return chats;

            var partners = await _repository.ChatMember.GetDirectChatPartnersAsync(
                directChatIds, _currentUser.UserId);

            var result = new List<ChatDto>(chats.Count);
            foreach (var chat in chats)
            {
                if (chat.IsPrivate)
                {
                    partners.TryGetValue(chat.Id, out var partner);
                    result.Add(MapToDirectChatDto(chat, partner));
                }
                else
                {
                    result.Add(chat);
                }
            }
            return result;
        }

        // личный чат, очищенный у себя, прячется до первого нового сообщения
        private async Task<List<ChatDto>> HideClearedDirectChatsAsync(List<ChatDto> chats)
        {
            if (chats.Count == 0) return chats;

            var cleared = await _repository.ChatMember.GetClearedAtByChatIdsAsync(
                _currentUser.UserId, chats.Select(c => c.Id));

            if (cleared.Count == 0) return chats;

            return chats.Where(c =>
                !c.IsPrivate ||
                !cleared.TryGetValue(c.Id, out var clearedAt) ||
                (c.LastMessageAt is not null && c.LastMessageAt > clearedAt)
            ).ToList();
        }

        private async Task<List<ChatDto>> AttachLastMessagesAsync(List<ChatDto> chats)
        {
            if (chats.Count == 0) return chats;

            var lastMessages = await _repository.Message.GetLastMessagesByChatIdsAsync(
                chats.Select(c => c.Id), _currentUser.UserId);
            var lastByChat = lastMessages.ToDictionary(m => m.ChatId);

            return chats.Select(c =>
                lastByChat.TryGetValue(c.Id, out var lm)
                    ? c with
                    {
                        LastMessageContent = _cipher.Decrypt(lm.Content),
                        LastMessageSenderName = lm.User?.UserName,
                        LastMessageSenderId = lm.UserId,
                        LastMessageAt = lm.CreatedAt
                    }
                    : c
            ).ToList();
        }

        private async Task EnsureCanBeInvitedAsync(int targetUserId)
        {
            var target = await _repository.User.GetUserAsync(targetUserId, trackChanges: false)
                ?? throw new UserNotFoundException(targetUserId);

            if (await _repository.UserBlock.IsBlockedEitherWayAsync(_currentUser.UserId, targetUserId))
                throw new BlockedUserException();

            await EnsurePrivacyAllowsAsync(target.WhoCanInvite, targetUserId, "group invites");
        }

        private async Task EnsurePrivacyAllowsAsync(int level, int targetUserId, string action)
        {
            if (level == PrivacyLevel.Everyone) return;

            if (level == PrivacyLevel.FriendsOnly &&
                await _repository.Friendship.AreFriendsAsync(_currentUser.UserId, targetUserId))
                return;

            throw new PrivacyRestrictedException(action);
        }

        private async Task<List<ChatDto>> AttachUnreadCountsAsync(List<ChatDto> chats)
        {
            if (chats.Count == 0) return chats;

            var counts = await _repository.Message.GetUnreadCountsAsync(
                _currentUser.UserId, chats.Select(c => c.Id));

            return chats.Select(c =>
                counts.TryGetValue(c.Id, out var n) ? c with { UnreadCount = n } : c
            ).ToList();
        }

        public async Task MarkReadAsync(int chatId)
        {
            await GetChatOrThrowAsync(chatId, trackChanges: false);
            var member = await _repository.ChatMember.GetMemberAsync(
                chatId, _currentUser.UserId, trackChanges: true);
            if (member is null)
                throw new ChatAccessDeniedException(chatId, _currentUser.UserId);

            member.LastReadAt = DateTime.UtcNow;
            await _repository.SaveAsync();
        }

        private void AddMember(int chatId, int userId, int roleId) =>
            _repository.ChatMember.CreateMember(new ChatMember
            {
                ChatId = chatId,
                UserId = userId,
                RoleId = roleId
            });

        private async Task EnsureCallerIsChatMember(int chatId, string? action = null)
        {
            var membership = await _currentUser.GetMembershipAsync(chatId);
            if (membership is null)
            {
                if (action is null)
                    throw new ChatAccessDeniedException(chatId, _currentUser.UserId);
                throw new InsufficientChatPermissionException(action, chatId);
            }
        }

        private async Task EnsureCallerIsAllowedAsync(Chat chat, int permission, string action)
        {
            var caller = await _currentUser.GetMembershipAsync(chat.Id);
            if (caller is null || !ChatPermission.Allows(permission, caller.RoleId))
                throw new InsufficientChatPermissionException(action, chat.Id);
        }

        private async Task EnsureCallerIsChatOwner(int chatId, string action)
        {
            var membership = await _currentUser.GetMembershipAsync(chatId);
            if (membership is null || membership.RoleId != UserRole.Owner)
                throw new InsufficientChatPermissionException(action, chatId);
        }

    }
}
