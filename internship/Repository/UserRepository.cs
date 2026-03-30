using Contracts;
using Entities.Models;

namespace internship.Repository
{
    public class UserRepository : RepositoryBase<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context) { }

        public IEnumerable<User> GetAllUsers(bool trackChanges) =>
            FindAll(trackChanges).ToList();

        public User? GetUser(int id, bool trackChanges) =>
            FindByCondition(u => u.Id == id, trackChanges).FirstOrDefault();

        public void CreateUser(User user) => Create(user);
        public void DeleteUser(User user) => Delete(user);
        public void UpdateUser(User user) => Update(user);
    }
}