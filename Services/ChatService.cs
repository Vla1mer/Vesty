using AutoMapper;
using Entities.Exceptions;
using Entities.Models;
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

        public ChatDto Create(ChatForCreationDto chatDto)
        {
            var chat = _mapper.Map<Chat>(chatDto);
            _repository.Chat.CreateChat(chat);
            _repository.Save();
            return _mapper.Map<ChatDto>(chat);
        }

        public void Delete(int id)
        {
            var chat = _repository.Chat.GetChat(id, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(id);

            _repository.Chat.DeleteChat(chat);
            _repository.Save();
        }
    }
}