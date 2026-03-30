using Contracts;
using Entities.Models;

namespace internship.Services
{
    public class MessageService
    {
        private readonly IRepositoryManager _repository;

        public MessageService(IRepositoryManager repository)
            => _repository = repository;

        public IEnumerable<Message> GetAll() =>
            _repository.Message.GetAllMessages(trackChanges: false);

        public Message? GetById(int id) =>
            _repository.Message.GetMessage(id, trackChanges: false);

        public Message Create(Message message)
        {
            _repository.Message.CreateMessage(message);
            _repository.Save();
            return message;
        }

        public bool Delete(int id)
        {
            var message = _repository.Message.GetMessage(id, trackChanges: false);
            if (message == null) return false;
            _repository.Message.DeleteMessage(message);
            _repository.Save();
            return true;
        }
    }
}