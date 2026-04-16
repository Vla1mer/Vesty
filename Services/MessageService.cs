using AutoMapper;
using Entities.Exceptions;
using Entities.Models;
using Entities.RequestFeatures;
using Repository.Interfaces;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace Services
{
    public class MessageService : IMessageService
    {
        private readonly IRepositoryManager _repository;
        private readonly ILoggerManager _logger;
        private readonly IMapper _mapper;

        public MessageService(IRepositoryManager repository, ILoggerManager logger, IMapper mapper)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<IEnumerable<MessageDto>> GetAllAsync(MessageParameters messageParameters)
        {
            var messages = await _repository.Message.GetAllMessagesAsync(messageParameters, trackChanges: false);
            return _mapper.Map<IEnumerable<MessageDto>>(messages);
        }

        public async Task<MessageDto> GetByIdAsync(int id)
        {
            var message = await _repository.Message.GetMessageAsync(id, trackChanges: false);
            if (message is null)
                throw new MessageNotFoundException(id);
            return _mapper.Map<MessageDto>(message);
        }

        public async Task<IEnumerable<MessageDto>> GetMessagesByChatAsync(int chatId, bool trackChanges)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            var messages = await _repository.Message.GetMessagesByChatAsync(chatId, trackChanges);
            return _mapper.Map<IEnumerable<MessageDto>>(messages);
        }

        public async Task<MessageDto> CreateMessageForChatAsync(int chatId, MessageForCreationDto messageDto)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            var message = _mapper.Map<Message>(messageDto);
            _repository.Message.CreateMessageForChat(chatId, message);
            await _repository.SaveAsync();
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
            await _repository.SaveAsync();
        }
    }
}