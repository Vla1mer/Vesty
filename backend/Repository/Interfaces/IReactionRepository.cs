using Entities.Models;

namespace Repository.Interfaces
{
    public interface IReactionRepository
    {
        Task<IEnumerable<MessageReaction>> GetByMessageIdsAsync(IEnumerable<int> messageIds);
        Task<MessageReaction?> GetReactionAsync(int messageId, int userId, string emoji, bool trackChanges);
        void CreateReaction(MessageReaction reaction);
        void DeleteReaction(MessageReaction reaction);
    }
}
