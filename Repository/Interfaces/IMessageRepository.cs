using Entities.Models;

namespace Repository.Interfaces
{
    public interface IMessageRepository
    {
        IEnumerable<Message> GetAllMessages(bool trackChanges);
    }
}