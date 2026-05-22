using Entities.Models;

namespace Repository.Interfaces
{
    public interface IChatMemberRepository
    {
        Task<IEnumerable<User>> GetUsersByChatIdAsync(int chatId, bool trackChanges);
        Task<ChatMember?> GetMemberAsync(int chatId, int userId, bool trackChanges);
        Task<bool> IsUserInChatAsync(int chatId, int userId);
        Task<IEnumerable<int>> GetChatIdsForUserAsync(int userId);
        void CreateMember(ChatMember member);
        void DeleteMember(ChatMember member);
    }
}
