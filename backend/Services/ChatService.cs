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
        private readonly ChatEnricher _enricher;

        public ChatService(IRepositoryManager repository, ILoggerManager logger, IMapper mapper,
            ICurrentUserService currentUser, IChatNotifier notifier, IMessageCipher cipher)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
            _currentUser = currentUser;
            _notifier = notifier;
            _enricher = new ChatEnricher(repository, currentUser, cipher);
        }

        public async Task<(IEnumerable<ChatDto> chats, MetaData metaData)> GetAllAsync(ChatParameters chatParameters)
        {
            var allowedChatIds = await _repository.ChatMember.GetChatIdsForUserAsync(_currentUser.UserId);
            var chatsWithMetaData = await _repository.Chat.GetAllChatsAsync(chatParameters, allowedChatIds, trackChanges: false);
            var chatsDto = _mapper.Map<IEnumerable<ChatDto>>(chatsWithMetaData).ToList();
            var result = await _enricher.EnrichListAsync(chatsDto);
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

            return (await _enricher.AttachUnreadCountsAsync([dto]))[0];
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
                return MapToDirectChatDto(existing, ChatMapper.ToPartner(otherUser));

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

            await _notifier.ChatCreatedAsync(new[] { currentUserId }, MapToDirectChatDto(chat, ChatMapper.ToPartner(otherUser)));
            await _notifier.ChatCreatedAsync(new[] { otherUserId },
                MapToDirectChatDto(chat, currentUser is null ? null : ChatMapper.ToPartner(currentUser)));

            return MapToDirectChatDto(chat, ChatMapper.ToPartner(otherUser));
        }

        private DirectChatDto MapToDirectChatDto(Chat chat, DirectChatPartner? partner) =>
            ChatMapper.ToDirectChatDto(_mapper.Map<ChatDto>(chat), partner);

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

            await _notifier.ChatUpdatedAsync(await GetMemberIdsAsync(id),
                new ChatUpdatedSignalrDto { ChatId = id });
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
            chat.Name = chatDto.Name.Trim();
            chat.Description = string.IsNullOrWhiteSpace(chatDto.Description)
                ? null
                : chatDto.Description.Trim();
            await _repository.SaveAsync();

            var memberIds = await GetMemberIdsAsync(id);
            await _notifier.ChatRenamedAsync(memberIds,
                new ChatRenamedSignalrDto { ChatId = id, Name = chat.Name });
            await _notifier.ChatUpdatedAsync(memberIds, new ChatUpdatedSignalrDto { ChatId = id });
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
