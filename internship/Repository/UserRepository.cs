using Contracts;
using Entities.Models;

namespace internship.Repository
{
    public class UserRepository : RepositoryBase<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context) { }

        public IEnumerable<User> GetAllUsers(bool trackChanges) =>
            FindAll(trackChanges).ToList();

    }
}