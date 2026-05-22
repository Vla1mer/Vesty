using AutoMapper;
using Shared.Exceptions;
using Entities.Models;
using Shared.RequestFeatures;
using Repository.Interfaces;
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

        public ChatService(IRepositoryManager repository, ILoggerManager logger, IMapper mapper,
            ICurrentUserService currentUser)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
            _currentUser = currentUser;
        }

        public async Task<(IEnumerable<ChatDto> chats, MetaData metaData)> GetAllAsync(ChatParameters chatParameters)
        {
            var allowedChatIds = await _repository.ChatMember.GetChatIdsForUserAsync(_currentUser.UserId);
            var chatsWithMetaData = await _repository.Chat.GetAllChatsAsync(chatParameters, allowedChatIds, trackChanges: false);
            var chatsDto = _mapper.Map<IEnumerable<ChatDto>>(chatsWithMetaData);
            return (chats: chatsDto, metaData: chatsWithMetaData.MetaData);
        }

        public async Task<ChatDto> GetByIdAsync(int id)
        {
            var chat = await GetChatOrThrowAsync(id, trackChanges: false);
            await EnsureCallerIsChatMember(id);
            return _mapper.Map<ChatDto>(chat);
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
            return _mapper.Map<ChatDto>(chat);
        }

        public async Task<ChatDto> CreateDirectChatAsync(int otherUserId)
        {
            var currentUserId = _currentUser.UserId;
            if (otherUserId == currentUserId)
                throw new DirectChatWithSelfException();

            await EnsureUserExistsAsync(otherUserId);

            var existing = await _repository.Chat.GetPrivateChatBetweenAsync(currentUserId, otherUserId);
            if (existing is not null)
                return _mapper.Map<ChatDto>(existing);

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

            return _mapper.Map<ChatDto>(chat);
        }

        public async Task DeleteAsync(int id)
        {
            var chat = await GetChatOrThrowAsync(id, trackChanges: false);

            if (chat.IsPrivate)
                await EnsureCallerIsChatMember(id, "delete this chat");
            else
                await EnsureCallerIsChatOwner(id, "delete this chat");

            _repository.Chat.DeleteChat(chat);
            await _repository.SaveAsync();
        }

        public async Task UpdateAsync(int id, ChatForUpdateDto chatDto)
        {
            var chat = await GetChatOrThrowAsync(id, trackChanges: true);
            if (chat.IsPrivate)
                throw new OperationNotAllowedInPrivateChatException("rename");
            await EnsureCallerIsChatOwner(id, "rename this chat");
            _mapper.Map(chatDto, chat);
            await _repository.SaveAsync();
        }

        private async Task<Chat> GetChatOrThrowAsync(int chatId, bool trackChanges)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            return chat;
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
