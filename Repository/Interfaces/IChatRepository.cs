using Entities.Models;
using Entities.RequestFeatures;

namespace Repository.Interfaces
{
    public interface IChatRepository
    {
        Task<IEnumerable<Chat>> GetAllChatsAsync(ChatParameters chatParameters, bool trackChanges);
        Task<Chat?> GetChatAsync(int id, bool trackChanges);
        void CreateChat(Chat chat);
        void DeleteChat(Chat chat);
    }
}