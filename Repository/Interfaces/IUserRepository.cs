using Entities.Models;

namespace Repository.Interfaces
{
    public interface IUserRepository
    {
        IEnumerable<User> GetAllUsers(bool trackChanges);
        IEnumerable<User> GetByIds(IEnumerable<int> ids, bool trackChanges);
        User? GetUser(int id, bool trackChanges);
        void CreateUser(User user);

    }
}