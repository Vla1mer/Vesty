using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;

namespace Repository
{
    public class ReactionRepository : RepositoryBase<MessageReaction>, IReactionRepository
    {
        public ReactionRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<MessageReaction>> GetByMessageIdsAsync(IEnumerable<int> messageIds)
        {
            var ids = messageIds.ToList();
            if (ids.Count == 0)
                return [];

            return await FindByCondition(r => ids.Contains(r.MessageId), trackChanges: false)
                .OrderBy(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<MessageReaction?> GetReactionAsync(int messageId, int userId, string emoji, bool trackChanges) =>
            await FindByCondition(
                    r => r.MessageId == messageId && r.UserId == userId && r.Emoji == emoji,
                    trackChanges)
                .FirstOrDefaultAsync();

        public void CreateReaction(MessageReaction reaction) => Create(reaction);

        public void DeleteReaction(MessageReaction reaction) => Delete(reaction);
    }
}
