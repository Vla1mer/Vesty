using AutoMapper;
using Repository.Interfaces;
using Entities.Exceptions;
using Services.Interfaces;
using Services.DataTransferObjects;

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

        public IEnumerable<ChatDto> GetAll()
        {
            var chats = _repository.Chat.GetAllChats(trackChanges: false);
            return _mapper.Map<IEnumerable<ChatDto>>(chats);
        }

        public ChatDto GetById(int id)
        {
            var chat = _repository.Chat.GetChat(id, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(id);

            return _mapper.Map<ChatDto>(chat);
        }
    }
}