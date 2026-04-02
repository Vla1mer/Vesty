using AutoMapper;
using Repository.Interfaces;
using Entities.Exceptions;
using Services.Interfaces;
using Services.DataTransferObjects;

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
    }
}