using Entities.Models;

namespace Repository.Interfaces
{
    public interface IChatRepository
    {
        IEnumerable<Chat> GetAllChats(bool trackChanges);
        Chat? GetChat(int id, bool trackChanges);
        void CreateChat(Chat chat);
        void DeleteChat(Chat chat);
    }
}