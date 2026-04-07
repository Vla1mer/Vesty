using Entities.Models;

namespace Repository.Interfaces
{
    public interface IUserRepository
    {
        IEnumerable<User> GetAllUsers(bool trackChanges);
        User? GetUser(int id, bool trackChanges);
        void CreateUser(User user);
    }
}