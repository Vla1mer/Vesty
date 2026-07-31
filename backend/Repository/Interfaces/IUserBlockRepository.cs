using Entities.Models;

namespace Repository.Interfaces
{
    public interface IUserBlockRepository
    {
        Task<UserBlock?> GetAsync(int blockerId, int blockedId, bool trackChanges);
        Task<IEnumerable<UserBlock>> GetByBlockerAsync(int blockerId);
        Task<bool> IsBlockedEitherWayAsync(int userId, int otherUserId);
        Task<IEnumerable<int>> GetRelatedUserIdsAsync(int userId);
        void CreateBlock(UserBlock block);
        void DeleteBlock(UserBlock block);
    }
}
