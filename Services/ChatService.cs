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

        public ChatService(IRepositoryManager repository, ILoggerManager logger, IMapper mapper)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<ChatDto> chats, MetaData metaData)> GetAllAsync(ChatParameters chatParameters)
        {
            var chatsWithMetaData = await _repository.Chat.GetAllChatsAsync(chatParameters, trackChanges: false);
            var chatsDto = _mapper.Map<IEnumerable<ChatDto>>(chatsWithMetaData);
            return (chats: chatsDto, metaData: chatsWithMetaData.MetaData);
        }

        public async Task<ChatDto> GetByIdAsync(int id)
        {
            var chat = await _repository.Chat.GetChatAsync(id, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(id);
            return _mapper.Map<ChatDto>(chat);
        }

        public async Task<ChatDto> CreateAsync(int currentUserId, ChatForCreationDto chatDto)
        {
            var chat = _mapper.Map<Chat>(chatDto);
            chat.CreatorId = currentUserId;
            chat.IsPrivate = false;
            _repository.Chat.CreateChat(chat);
            await _repository.SaveAsync();

            _repository.ChatMember.CreateMember(new ChatMember
            {
                ChatId = chat.Id,
                UserId = currentUserId,
                RoleId = ChatRoleIds.Owner
            });

            var seenUserIds = new HashSet<int> { currentUserId };
            foreach (var memberDto in chatDto.Members)
            {
                if (!seenUserIds.Add(memberDto.UserId))
                    throw new UserAlreadyInChatException(chat.Id, memberDto.UserId);

                var user = await _repository.User.GetUserAsync(memberDto.UserId, trackChanges: false);
                if (user is null)
                    throw new UserNotFoundException(memberDto.UserId);

                _repository.ChatMember.CreateMember(new ChatMember
                {
                    ChatId = chat.Id,
                    UserId = memberDto.UserId,
                    RoleId = ChatRoleIds.User
                });
            }

            await _repository.SaveAsync();
            return _mapper.Map<ChatDto>(chat);
        }

        public async Task<ChatDto> CreateDirectChatAsync(int currentUserId, int otherUserId)
        {
            if (otherUserId == currentUserId)
                throw new DirectChatWithSelfException();

            var otherUser = await _repository.User.GetUserAsync(otherUserId, trackChanges: false);
            if (otherUser is null)
                throw new UserNotFoundException(otherUserId);

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

            _repository.ChatMember.CreateMember(new ChatMember
            {
                ChatId = chat.Id,
                UserId = currentUserId,
                RoleId = ChatRoleIds.User
            });
            _repository.ChatMember.CreateMember(new ChatMember
            {
                ChatId = chat.Id,
                UserId = otherUserId,
                RoleId = ChatRoleIds.User
            });
            await _repository.SaveAsync();

            return _mapper.Map<ChatDto>(chat);
        }

        public async Task DeleteAsync(int id, int currentUserId)
        {
            var chat = await _repository.Chat.GetChatAsync(id, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(id);

            if (chat.IsPrivate)
            {
                var member = await _repository.ChatMember.GetMemberAsync(id, currentUserId, trackChanges: false);
                if (member is null)
                    throw new InsufficientChatPermissionException("delete this chat", id);
            }
            else
            {
                await EnsureUserIsOwner(id, currentUserId, "delete this chat");
            }

            _repository.Chat.DeleteChat(chat);
            await _repository.SaveAsync();
        }

        public async Task UpdateAsync(int id, int currentUserId, ChatForUpdateDto chatDto)
        {
            var chat = await _repository.Chat.GetChatAsync(id, trackChanges: true);
            if (chat is null)
                throw new ChatNotFoundException(id);
            if (chat.IsPrivate)
                throw new OperationNotAllowedInPrivateChatException("rename");
            await EnsureUserIsOwner(id, currentUserId, "rename this chat");
            _mapper.Map(chatDto, chat);
            await _repository.SaveAsync();
        }

        private async Task EnsureUserIsOwner(int chatId, int userId, string action)
        {
            var member = await _repository.ChatMember.GetMemberAsync(chatId, userId, trackChanges: false);
            if (member is null || member.RoleId != ChatRoleIds.Owner)
                throw new InsufficientChatPermissionException(action, chatId);
        }
    }
}
