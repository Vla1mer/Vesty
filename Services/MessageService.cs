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

        public async Task<(IEnumerable<MessageDto> messages, MetaData metaData)> GetAllAsync(MessageParameters messageParameters)
        {
            if (!messageParameters.ValidCreatedAtRange)
                throw new MaxCreatedAtRangeBadRequestException();

            var messagesWithMetaData = await _repository.Message.GetAllMessagesAsync(messageParameters, trackChanges: false);
            DecryptInPlace(messagesWithMetaData);
            var messagesDto = _mapper.Map<IEnumerable<MessageDto>>(messagesWithMetaData);
            return (messages: messagesDto, metaData: messagesWithMetaData.MetaData);
        }

        public async Task<MessageDto> GetByIdAsync(int id)
        {
            var message = await _repository.Message.GetMessageAsync(id, trackChanges: false);
            if (message is null)
                throw new MessageNotFoundException(id);
            message.Content = _cipher.Decrypt(message.Content);
            return _mapper.Map<MessageDto>(message);
        }

        public async Task<IEnumerable<MessageDto>> GetMessagesByChatAsync(int chatId, bool trackChanges)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            var messages = await _repository.Message.GetMessagesByChatAsync(chatId, trackChanges);
            DecryptInPlace(messages);
            return _mapper.Map<IEnumerable<MessageDto>>(messages);
        }

        public async Task<MessageDto> CreateMessageForChatAsync(int chatId, MessageForCreationDto messageDto)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            var message = _mapper.Map<Message>(messageDto);
            message.Content = _cipher.Encrypt(message.Content);
            _repository.Message.CreateMessageForChat(chatId, message);
            await _repository.SaveAsync();
            message.Content = _cipher.Decrypt(message.Content);
            return _mapper.Map<MessageDto>(message);
        }

        public async Task DeleteAsync(int id)
        {
            var message = await _repository.Message.GetMessageAsync(id, trackChanges: false);
            if (message is null)
                throw new MessageNotFoundException(id);
            _repository.Message.DeleteMessage(message);
            await _repository.SaveAsync();
        }

        public async Task UpdateMessageForChatAsync(int chatId, int id, MessageForUpdateDto messageDto)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            var message = await _repository.Message.GetMessageAsync(id, trackChanges: true);
            if (message is null)
                throw new MessageNotFoundException(id);
            _mapper.Map(messageDto, message);
            message.Content = _cipher.Encrypt(message.Content);
            await _repository.SaveAsync();
        }

        private void DecryptInPlace(IEnumerable<Message> messages)
        {
            foreach (var m in messages)
                m.Content = _cipher.Decrypt(m.Content);
        }
    }
}
