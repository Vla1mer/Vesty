using Repository.Interfaces;
using Entities.Models;
using Services.Interfaces;

namespace Services
{
    public class ChatService : IChatService
    {
        private readonly IRepositoryManager _repository;

        public ChatService(IRepositoryManager repository)
            => _repository = repository;

        public IEnumerable<Chat> GetAll() =>
            _repository.Chat.GetAllChats(trackChanges: false);
    }
}