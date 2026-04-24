using Entities.Models;
using Shared.RequestFeatures;

namespace Repository.Interfaces
{
    public interface IUserRepository
    {
        Task<PagedList<User>> GetAllUsersAsync(UserParameters userParameters, bool trackChanges);
        Task<IEnumerable<User>> GetByIdsAsync(IEnumerable<int> ids, bool trackChanges);
        Task<User?> GetUserAsync(int id, bool trackChanges);
        void CreateUser(User user);
        void DeleteUser(User user);
    }
}