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

        public MessageService(IRepositoryManager repository, ILoggerManager logger, IMapper mapper,
            IMessageCipher cipher)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
            _cipher = cipher;
        }

        public async Task<(IEnumerable<MessageDto> messages, MetaData metaData)> GetAllAsync(int currentUserId, MessageParameters messageParameters)
        {
            if (!messageParameters.ValidCreatedAtRange)
                throw new MaxCreatedAtRangeBadRequestException();

            var allowedChatIds = await _repository.ChatMember.GetChatIdsForUserAsync(currentUserId);
            var messagesWithMetaData = await _repository.Message.GetAllMessagesAsync(messageParameters, allowedChatIds, trackChanges: false);
            DecryptInPlace(messagesWithMetaData);
            var messagesDto = _mapper.Map<IEnumerable<MessageDto>>(messagesWithMetaData);
            return (messages: messagesDto, metaData: messagesWithMetaData.MetaData);
        }

        public async Task<MessageDto> GetByIdAsync(int id, int currentUserId)
        {
            var message = await _repository.Message.GetMessageAsync(id, trackChanges: false);
            if (message is null)
                throw new MessageNotFoundException(id);
            await EnsureUserIsChatMember(message.ChatId, currentUserId);
            message.Content = _cipher.Decrypt(message.Content);
            return _mapper.Map<MessageDto>(message);
        }

        public async Task<IEnumerable<MessageDto>> GetMessagesByChatAsync(int chatId, int currentUserId, bool trackChanges)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            await EnsureUserIsChatMember(chatId, currentUserId);
            var messages = await _repository.Message.GetMessagesByChatAsync(chatId, trackChanges);
            DecryptInPlace(messages);
            return _mapper.Map<IEnumerable<MessageDto>>(messages);
        }

        public async Task<MessageDto> CreateMessageForChatAsync(int chatId, int currentUserId, MessageForCreationDto messageDto)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            await EnsureUserIsChatMember(chatId, currentUserId);
            var message = _mapper.Map<Message>(messageDto);
            message.UserId = currentUserId;
            message.Content = _cipher.Encrypt(message.Content);
            _repository.Message.CreateMessageForChat(chatId, message);
            await _repository.SaveAsync();
            message.Content = _cipher.Decrypt(message.Content);
            return _mapper.Map<MessageDto>(message);
        }

        public async Task DeleteAsync(int id, int currentUserId)
        {
            var message = await _repository.Message.GetMessageAsync(id, trackChanges: false);
            if (message is null)
                throw new MessageNotFoundException(id);

            if (message.UserId != currentUserId)
            {
                var caller = await _repository.ChatMember.GetMemberAsync(message.ChatId, currentUserId, trackChanges: false);
                var isModerator = caller is not null &&
                    (caller.RoleId == ChatRoleIds.Owner || caller.RoleId == ChatRoleIds.Admin);
                if (!isModerator)
                    throw new MessageOwnershipException(id);
            }

            _repository.Message.DeleteMessage(message);
            await _repository.SaveAsync();
        }

        public async Task UpdateMessageForChatAsync(int chatId, int id, int currentUserId, MessageForUpdateDto messageDto)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            await EnsureUserIsChatMember(chatId, currentUserId);
            var message = await _repository.Message.GetMessageAsync(id, trackChanges: true);
            if (message is null)
                throw new MessageNotFoundException(id);
            if (message.UserId != currentUserId)
                throw new MessageOwnershipException(id);
            _mapper.Map(messageDto, message);
            message.Content = _cipher.Encrypt(message.Content);
            await _repository.SaveAsync();
        }

        private async Task EnsureUserIsChatMember(int chatId, int userId)
        {
            var isMember = await _repository.ChatMember.IsUserInChatAsync(chatId, userId);
            if (!isMember)
                throw new ChatAccessDeniedException(chatId, userId);
        }

        private void DecryptInPlace(IEnumerable<Message> messages)
        {
            foreach (var m in messages)
                m.Content = _cipher.Decrypt(m.Content);
        }
    }
}
