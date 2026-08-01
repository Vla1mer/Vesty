using Entities.Models;

namespace Repository.Interfaces
{
    public interface IChatInviteRepository
    {
        Task<ChatInvite?> GetActiveByChatAsync(int chatId, DateTime now, bool trackChanges);
        Task<IEnumerable<ChatInvite>> GetActiveByChatForRevokeAsync(int chatId, DateTime now);
        Task<ChatInvite?> GetByCodeAsync(string code, bool trackChanges);
        void CreateInvite(ChatInvite invite);
    }
}
