using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;

namespace Repository
{
    public class UserBlockRepository : RepositoryBase<UserBlock>, IUserBlockRepository
    {
        public UserBlockRepository(AppDbContext context) : base(context) { }

        public async Task<UserBlock?> GetAsync(int blockerId, int blockedId, bool trackChanges) =>
            await FindByCondition(b => b.BlockerId == blockerId && b.BlockedId == blockedId, trackChanges)
                .FirstOrDefaultAsync();

        public async Task<IEnumerable<UserBlock>> GetByBlockerAsync(int blockerId) =>
            await FindByCondition(b => b.BlockerId == blockerId, trackChanges: false)
                .Include(b => b.Blocked)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();

        public async Task<bool> IsBlockedEitherWayAsync(int userId, int otherUserId) =>
            await FindByCondition(
                b => (b.BlockerId == userId && b.BlockedId == otherUserId) ||
                     (b.BlockerId == otherUserId && b.BlockedId == userId),
                trackChanges: false)
                .AnyAsync();

        public async Task<IEnumerable<int>> GetRelatedUserIdsAsync(int userId) =>
            await FindByCondition(
                b => b.BlockerId == userId || b.BlockedId == userId,
                trackChanges: false)
                .Select(b => b.BlockerId == userId ? b.BlockedId : b.BlockerId)
                .Distinct()
                .ToListAsync();

        public void CreateBlock(UserBlock block) => Create(block);

        public void DeleteBlock(UserBlock block) => Delete(block);
    }
}
