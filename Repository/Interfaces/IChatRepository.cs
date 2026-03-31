using Entities.Models;

namespace Repository.Interfaces
{
    public interface IChatRepository
    {
        IEnumerable<Chat> GetAllChats(bool trackChanges);

    }
}