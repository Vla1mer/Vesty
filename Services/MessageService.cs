using Repository.Interfaces;
using Entities.Models;

namespace Services
{
    public class MessageService
    {
        private readonly IRepositoryManager _repository;

        public MessageService(IRepositoryManager repository)
            => _repository = repository;

        public IEnumerable<Message> GetAll() =>
            _repository.Message.GetAllMessages(trackChanges: false);

    }
}