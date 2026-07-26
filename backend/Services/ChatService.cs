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
            return (chats: result, metaData: chatsWithMetaData.MetaData);
        }

        public async Task<ChatDto> GetByIdAsync(int id)
        {
            var chat = await GetChatOrThrowAsync(id, trackChanges: false);
            await EnsureCallerIsChatMember(id);

            if (!chat.IsPrivate)
                return _mapper.Map<ChatDto>(chat);

            var partnerNames = await _repository.ChatMember.GetDirectChatPartnerNamesAsync(
                new[] { chat.Id }, _currentUser.UserId);
            partnerNames.TryGetValue(chat.Id, out var partnerName);

            return new DirectChatDto
            {
                Id = chat.Id,
                Name = chat.Name,
                CreatorId = chat.CreatorId,
                IsPrivate = chat.IsPrivate,
                CreatedAt = chat.CreatedAt,
                PartnerUserName = partnerName
            };
        }

        public async Task<ChatDto> CreateAsync(ChatForCreationDto chatDto)
        {
            var currentUserId = _currentUser.UserId;
            var chat = _mapper.Map<Chat>(chatDto);
            chat.CreatorId = currentUserId;
            chat.IsPrivate = false;
            _repository.Chat.CreateChat(chat);
            await _repository.SaveAsync();

            AddMember(chat.Id, currentUserId, UserRole.Owner);

            var seenUserIds = new HashSet<int> { currentUserId };
            foreach (var memberDto in chatDto.Members)
            {
                if (!seenUserIds.Add(memberDto.UserId))
                    throw new UserAlreadyInChatException(chat.Id, memberDto.UserId);

                await EnsureUserExistsAsync(memberDto.UserId);
                AddMember(chat.Id, memberDto.UserId, UserRole.User);
            }

            await _repository.SaveAsync();

            var createdDto = _mapper.Map<ChatDto>(chat);
            await _notifier.ChatCreatedAsync(seenUserIds, createdDto);
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

            var existing = await _repository.Chat.GetPrivateChatBetweenAsync(currentUserId, otherUserId);
            if (existing is not null)
                return MapToDirectChatDto(existing, otherUser.UserName);

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

            await _notifier.ChatCreatedAsync(new[] { currentUserId }, MapToDirectChatDto(chat, otherUser.UserName));
            await _notifier.ChatCreatedAsync(new[] { otherUserId }, MapToDirectChatDto(chat, _currentUser.UserName));

            return MapToDirectChatDto(chat, otherUser.UserName);
        }

        private static DirectChatDto MapToDirectChatDto(Chat chat, string? partnerUserName) =>
            new DirectChatDto
            {
                Id = chat.Id,
                Name = chat.Name,
                CreatorId = chat.CreatorId,
                IsPrivate = chat.IsPrivate,
                CreatedAt = chat.CreatedAt,
                PartnerUserName = partnerUserName
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

        public async Task RenameAsync(int id, ChatForRenameDto chatDto)
        {
            var chat = await GetChatOrThrowAsync(id, trackChanges: true);
            if (chat.IsPrivate)
                throw new OperationNotAllowedInPrivateChatException("rename");
            await EnsureCallerIsChatOwner(id, "rename this chat");
            chat.Name = chatDto.Name;
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

            var partnerNames = await _repository.ChatMember.GetDirectChatPartnerNamesAsync(
                directChatIds, _currentUser.UserId);

            var result = new List<ChatDto>(chats.Count);
            foreach (var chat in chats)
            {
                if (chat.IsPrivate)
                {
                    partnerNames.TryGetValue(chat.Id, out var partnerName);
                    result.Add(new DirectChatDto
                    {
                        Id = chat.Id,
                        Name = chat.Name,
                        CreatorId = chat.CreatorId,
                        IsPrivate = chat.IsPrivate,
                        CreatedAt = chat.CreatedAt,
                        PartnerUserName = partnerName
                    });
                }
                else
                {
                    result.Add(chat);
                }
            }
            return result;
        }

        private async Task<List<ChatDto>> AttachLastMessagesAsync(List<ChatDto> chats)
        {
            if (chats.Count == 0) return chats;

            var lastMessages = await _repository.Message.GetLastMessagesByChatIdsAsync(
                chats.Select(c => c.Id));
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

        private async Task EnsureCallerIsChatOwner(int chatId, string action)
        {
            var membership = await _currentUser.GetMembershipAsync(chatId);
            if (membership is null || membership.RoleId != UserRole.Owner)
                throw new InsufficientChatPermissionException(action, chatId);
        }

        private async Task EnsureUserExistsAsync(int userId)
        {
            var user = await _repository.User.GetUserAsync(userId, trackChanges: false);
            if (user is null)
                throw new UserNotFoundException(userId);
        }
    }
}
