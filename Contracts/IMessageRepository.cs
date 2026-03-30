using Entities.Models;

namespace Contracts
{
    public interface IMessageRepository
    {
        IEnumerable<Message> GetAllMessages(bool trackChanges);
    }
}