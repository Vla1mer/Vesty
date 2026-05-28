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
    public class MessageService : IMessageService
    {
        private readonly IRepositoryManager _repository;
        private readonly ILoggerManager _logger;
        private readonly IMapper _mapper;
        private readonly IMessageCipher _cipher;
        private readonly ICurrentUserService _currentUser;

        public MessageService(IRepositoryManager repository, ILoggerManager logger, IMapper mapper,
            IMessageCipher cipher, ICurrentUserService currentUser)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
            _cipher = cipher;
            _currentUser = currentUser;
        }

        public async Task<(IEnumerable<MessageDto> messages, MetaData metaData)> GetAllAsync(MessageParameters messageParameters)
        {
            if (!messageParameters.ValidCreatedAtRange)
                throw new MaxCreatedAtRangeBadRequestException();

            var allowedChatIds = await _repository.ChatMember.GetChatIdsForUserAsync(_currentUser.UserId);
            var messagesWithMetaData = await _repository.Message.GetAllMessagesAsync(messageParameters, allowedChatIds, trackChanges: false);
            DecryptInPlace(messagesWithMetaData);
            var messagesDto = _mapper.Map<IEnumerable<MessageDto>>(messagesWithMetaData);
            return (messages: messagesDto, metaData: messagesWithMetaData.MetaData);
        }

        public async Task<MessageDto> GetByIdAsync(int id)
        {
            var message = await GetMessageOrThrowAsync(id, trackChanges: false);
            await EnsureCallerIsChatMember(message.ChatId);
            message.Content = _cipher.Decrypt(message.Content);
            return _mapper.Map<MessageDto>(message);
        }

        public async Task<IEnumerable<MessageDto>> GetMessagesByChatAsync(int chatId, bool trackChanges)
        {
            await GetChatOrThrowAsync(chatId);
            await EnsureCallerIsChatMember(chatId);
            var messages = await _repository.Message.GetMessagesByChatAsync(chatId, trackChanges);
            DecryptInPlace(messages);
            return _mapper.Map<IEnumerable<MessageDto>>(messages);
        }

        public async Task<MessageDto> CreateMessageForChatAsync(int chatId, MessageForCreationDto messageDto)
        {
            await GetChatOrThrowAsync(chatId);
            await EnsureCallerIsChatMember(chatId);

            var message = _mapper.Map<Message>(messageDto);
            message.UserId = _currentUser.UserId;
            message.Content = _cipher.Encrypt(message.Content);
            _repository.Message.CreateMessageForChat(chatId, message);
            await _repository.SaveAsync();
            message.Content = _cipher.Decrypt(message.Content);
            return _mapper.Map<MessageDto>(message);
        }

        public async Task<DirectMessageResultDto> SendDirectMessageAsync(int otherUserId, MessageForCreationDto messageDto)
        {
            var currentUserId = _currentUser.UserId;
            if (otherUserId == currentUserId)
                throw new DirectChatWithSelfException();

            var otherUser = await _repository.User.GetUserAsync(otherUserId, trackChanges: false);
            if (otherUser is null)
                throw new UserNotFoundException(otherUserId);

            var chat = await _repository.Chat.GetPrivateChatBetweenAsync(currentUserId, otherUserId);
            if (chat is null)
            {
                chat = new Chat
                {
                    Name = null,
                    CreatorId = currentUserId,
                    IsPrivate = true
                };
                _repository.Chat.CreateChat(chat);
                await _repository.SaveAsync();

                _repository.ChatMember.CreateMember(new ChatMember { ChatId = chat.Id, UserId = currentUserId, RoleId = UserRole.User });
                _repository.ChatMember.CreateMember(new ChatMember { ChatId = chat.Id, UserId = otherUserId, RoleId = UserRole.User });
                await _repository.SaveAsync();
            }

            var message = _mapper.Map<Message>(messageDto);
            message.UserId = currentUserId;
            message.Content = _cipher.Encrypt(message.Content);
            _repository.Message.CreateMessageForChat(chat.Id, message);
            await _repository.SaveAsync();
            message.Content = _cipher.Decrypt(message.Content);

            var chatDto = _mapper.Map<ChatDto>(chat) with { PartnerUserName = otherUser.UserName };
            var messageReturnDto = _mapper.Map<MessageDto>(message);

            return new DirectMessageResultDto { Chat = chatDto, Message = messageReturnDto };
        }

        public async Task DeleteAsync(int id)
        {
            var message = await GetMessageOrThrowAsync(id, trackChanges: false);
            await EnsureCallerCanModerateMessage(message);
            _repository.Message.DeleteMessage(message);
            await _repository.SaveAsync();
        }

        public async Task UpdateMessageForChatAsync(int chatId, int id, MessageForUpdateDto messageDto)
        {
            await GetChatOrThrowAsync(chatId);
            await EnsureCallerIsChatMember(chatId);

            var message = await GetMessageOrThrowAsync(id, trackChanges: true);
            if (message.UserId != _currentUser.UserId)
                throw new MessageOwnershipException(id);
            _mapper.Map(messageDto, message);
            message.Content = _cipher.Encrypt(message.Content);
            await _repository.SaveAsync();
        }

        private async Task<Chat> GetChatOrThrowAsync(int chatId)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            return chat;
        }

        private async Task<Message> GetMessageOrThrowAsync(int id, bool trackChanges)
        {
            var message = await _repository.Message.GetMessageAsync(id, trackChanges);
            if (message is null)
                throw new MessageNotFoundException(id);
            return message;
        }

        private async Task EnsureCallerIsChatMember(int chatId)
        {
            var member = await _currentUser.GetMembershipAsync(chatId);
            if (member is null)
                throw new ChatAccessDeniedException(chatId, _currentUser.UserId);
        }

        private async Task EnsureCallerCanModerateMessage(Message message)
        {
            if (message.UserId == _currentUser.UserId)
                return;

            var caller = await _currentUser.GetMembershipAsync(message.ChatId);
            var isModerator = caller is not null &&
                (caller.RoleId == UserRole.Owner || caller.RoleId == UserRole.Admin);
            if (!isModerator)
                throw new MessageOwnershipException(message.Id);
        }

        private void DecryptInPlace(IEnumerable<Message> messages)
        {
            foreach (var m in messages)
                m.Content = _cipher.Decrypt(m.Content);
        }
    }
}
