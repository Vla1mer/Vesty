using Entities.Models;
using Shared.RequestFeatures;

namespace Repository.Interfaces
{
    public interface IChatRepository
    {
        Task<PagedList<Chat>> GetAllChatsAsync(ChatParameters chatParameters, IEnumerable<int> allowedChatIds, bool trackChanges);
        Task<Chat?> GetChatAsync(int id, bool trackChanges);
        Task<Chat?> GetPrivateChatBetweenAsync(int userIdA, int userIdB);
        Task<IEnumerable<int>> GetPrivateChatPartnerIdsAsync(int userId);
        void CreateChat(Chat chat);
        void DeleteChat(Chat chat);
    }
}
