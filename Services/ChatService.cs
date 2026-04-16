using AutoMapper;
using Entities.Exceptions;
using Entities.Models;
using Entities.RequestFeatures;
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

        public async Task<ChatDto> CreateAsync(ChatForCreationDto chatDto)
        {
            var chat = _mapper.Map<Chat>(chatDto);
            _repository.Chat.CreateChat(chat);
            await _repository.SaveAsync();
            return _mapper.Map<ChatDto>(chat);
        }

        public async Task DeleteAsync(int id)
        {
            var chat = await _repository.Chat.GetChatAsync(id, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(id);
            _repository.Chat.DeleteChat(chat);
            await _repository.SaveAsync();
        }

        public async Task UpdateAsync(int id, ChatForUpdateDto chatDto)
        {
            var chat = await _repository.Chat.GetChatAsync(id, trackChanges: true);
            if (chat is null)
                throw new ChatNotFoundException(id);
            _mapper.Map(chatDto, chat);
            await _repository.SaveAsync();
        }
    }
}