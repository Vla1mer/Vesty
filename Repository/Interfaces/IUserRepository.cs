using Entities.Models;

namespace Repository.Interfaces
{
    public interface IUserRepository
    {
        Task<IEnumerable<User>> GetAllUsersAsync(bool trackChanges);
        Task<IEnumerable<User>> GetByIdsAsync(IEnumerable<int> ids, bool trackChanges);
        Task<User?> GetUserAsync(int id, bool trackChanges);
        void CreateUser(User user);
        void DeleteUser(User user);
    }
}