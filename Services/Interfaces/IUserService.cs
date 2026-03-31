using Entities.Models;

namespace Services.Interfaces
{
    public interface IUserService
    {
        IEnumerable<User> GetAll();
    }
}