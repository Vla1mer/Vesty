using Contracts;
using Entities.Models;

namespace internship.Services
{
    public class MessageService
    {
        private readonly IRepositoryManager _repository;

        public MessageService(IRepositoryManager repository)
            => _repository = repository;

        public async Task<IEnumerable<Message>> GetAllAsync() =>
            await _repository.Message.GetAllMessagesAsync(trackChanges: false);

        public async Task<Message?> GetByIdAsync(int id) =>
            await _repository.Message.GetMessageAsync(id, trackChanges: false);

        public async Task<Message> CreateAsync(Message message)
        {
            message.CreatedAt = DateTime.UtcNow;
            _repository.Message.CreateMessage(message);
            await _repository.SaveAsync();
            return message;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var message = await _repository.Message.GetMessageAsync(id, trackChanges: false);
            if (message == null) return false;

            _repository.Message.DeleteMessage(message);
            await _repository.SaveAsync();
            return true;
        }
    }
}