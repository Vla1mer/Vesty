using Repository.Interfaces;
using Entities.Models;

namespace Services
{
    public class ChatService
    {
        private readonly IRepositoryManager _repository;

        public ChatService(IRepositoryManager repository)
            => _repository = repository;

        public IEnumerable<Chat> GetAll() =>
            _repository.Chat.GetAllChats(trackChanges: false);

    }
}