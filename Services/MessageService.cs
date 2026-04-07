using AutoMapper;
using Entities.Exceptions;
using Entities.Models;
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

        public IEnumerable<MessageDto> GetAll()
        {
            var messages = _repository.Message.GetAllMessages(trackChanges: false);
            return _mapper.Map<IEnumerable<MessageDto>>(messages);
        }

        public MessageDto GetById(int id)
        {
            var message = _repository.Message.GetMessage(id, trackChanges: false);
            if (message is null)
                throw new MessageNotFoundException(id);

            return _mapper.Map<MessageDto>(message);
        }

        public IEnumerable<MessageDto> GetMessagesByChat(int chatId, bool trackChanges)
        {
            var chat = _repository.Chat.GetChat(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);

            var messages = _repository.Message.GetMessagesByChat(chatId, trackChanges);
            return _mapper.Map<IEnumerable<MessageDto>>(messages);
        }

        public MessageDto Create(MessageForCreationDto messageDto)
        {
            var message = _mapper.Map<Message>(messageDto);
            _repository.Message.CreateMessage(message);
            _repository.Save();
            return _mapper.Map<MessageDto>(message);
        }

        public MessageDto CreateMessageForChat(int chatId, MessageForCreationDto messageDto)
        {
            var chat = _repository.Chat.GetChat(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);

            var message = _mapper.Map<Message>(messageDto);
            _repository.Message.CreateMessageForChat(chatId, message);
            _repository.Save();
            return _mapper.Map<MessageDto>(message);
        }
    }
}