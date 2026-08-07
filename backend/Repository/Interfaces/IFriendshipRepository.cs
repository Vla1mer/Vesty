using Entities.Models;

namespace Repository.Interfaces
{
    public interface IFriendshipRepository
    {
        Task<Friendship?> GetBetweenAsync(int userId, int otherUserId, bool trackChanges);
        Task<IEnumerable<Friendship>> GetByStatusAsync(int userId, int status, bool trackChanges);
        Task<bool> AreFriendsAsync(int userId, int otherUserId);
        Task<IEnumerable<int>> GetFriendIdsAsync(int userId);
        void CreateFriendship(Friendship friendship);
        void DeleteFriendship(Friendship friendship);
    }
}
