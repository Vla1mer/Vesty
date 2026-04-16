using Entities.Models;

namespace Repository.Interfaces
{
    public interface IChatRepository
    {
        Task<IEnumerable<Chat>> GetAllChatsAsync(bool trackChanges);
        Task<Chat?> GetChatAsync(int id, bool trackChanges);
        void CreateChat(Chat chat);
        void DeleteChat(Chat chat);
    }
}