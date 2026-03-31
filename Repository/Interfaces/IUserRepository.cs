using Entities.Models;

namespace Repository.Interfaces
{
    public interface IUserRepository
    {
        IEnumerable<User> GetAllUsers(bool trackChanges);
    }
}