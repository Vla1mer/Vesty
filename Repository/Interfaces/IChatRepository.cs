using Entities.Models;
using Shared.RequestFeatures;

namespace Repository.Interfaces
{
    public interface IChatRepository
    {
        Task<PagedList<Chat>> GetAllChatsAsync(ChatParameters chatParameters, bool trackChanges);
        Task<Chat?> GetChatAsync(int id, bool trackChanges);
        void CreateChat(Chat chat);
        void DeleteChat(Chat chat);
    }
}