using Entities.Models;

namespace Contracts
{
    public interface IMessageRepository
    {
        IEnumerable<Message> GetAllMessages(bool trackChanges);
        Message? GetMessage(int id, bool trackChanges);
        void CreateMessage(Message message);
        void DeleteMessage(Message message);
    }
}