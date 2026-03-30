using Entities.Models;

namespace Contracts
{
    public interface IChatRepository
    {
        IEnumerable<Chat> GetAllChats(bool trackChanges);

    }
}