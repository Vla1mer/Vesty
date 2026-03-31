using Repository.Interfaces;
using Entities.Models;
using Services.Interfaces;

namespace Services
{
    public class MessageService : IMessageService
    {
        private readonly IRepositoryManager _repository;

        public MessageService(IRepositoryManager repository)
            => _repository = repository;

        public IEnumerable<Message> GetAll() =>
            _repository.Message.GetAllMessages(trackChanges: false);
    }
}