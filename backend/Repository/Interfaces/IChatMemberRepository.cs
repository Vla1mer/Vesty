using Entities.Models;
using Shared.RequestFeatures;

namespace Repository.Interfaces
{
    public interface IChatMemberRepository
    {
        Task<IEnumerable<ChatMember>> GetMembersByChatIdAsync(int chatId, bool trackChanges);
        Task<ChatMember?> GetMemberAsync(int chatId, int userId, bool trackChanges);
        Task<bool> IsUserInChatAsync(int chatId, int userId);
        Task<IEnumerable<int>> GetChatIdsForUserAsync(int userId);
        Task<IEnumerable<int>> GetChatPartnerIdsAsync(int userId);
        Task<Dictionary<int, DateTime>> GetClearedAtByChatIdsAsync(int userId, IEnumerable<int> chatIds);
        Task<Dictionary<int, DirectChatPartner>> GetDirectChatPartnersAsync(IEnumerable<int> chatIds, int currentUserId);
        void CreateMember(ChatMember member);
        void DeleteMember(ChatMember member);
    }
}
