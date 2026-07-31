using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;

namespace Repository
{
    public class FriendshipRepository : RepositoryBase<Friendship>, IFriendshipRepository
    {
        public FriendshipRepository(AppDbContext context) : base(context) { }

        public async Task<Friendship?> GetBetweenAsync(int userId, int otherUserId, bool trackChanges) =>
            await FindByCondition(
                f => (f.RequesterId == userId && f.AddresseeId == otherUserId) ||
                     (f.RequesterId == otherUserId && f.AddresseeId == userId),
                trackChanges)
                .FirstOrDefaultAsync();

        public async Task<IEnumerable<Friendship>> GetByStatusAsync(int userId, int status, bool trackChanges) =>
            await FindByCondition(
                f => f.Status == status && (f.RequesterId == userId || f.AddresseeId == userId),
                trackChanges)
                .Include(f => f.Requester)
                .Include(f => f.Addressee)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

        public async Task<IEnumerable<int>> GetFriendIdsAsync(int userId) =>
            await FindByCondition(
                f => f.Status == Friendship.Accepted &&
                     (f.RequesterId == userId || f.AddresseeId == userId),
                trackChanges: false)
                .Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId)
                .ToListAsync();

        public async Task<bool> AreFriendsAsync(int userId, int otherUserId) =>
            await FindByCondition(
                f => f.Status == Friendship.Accepted &&
                     ((f.RequesterId == userId && f.AddresseeId == otherUserId) ||
                      (f.RequesterId == otherUserId && f.AddresseeId == userId)),
                trackChanges: false)
                .AnyAsync();

        public void CreateFriendship(Friendship friendship) => Create(friendship);

        public void DeleteFriendship(Friendship friendship) => Delete(friendship);
    }
}
