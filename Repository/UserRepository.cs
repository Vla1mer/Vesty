using Repository.Interfaces;
using Entities.Models;

namespace Repository
{
    public class UserRepository : RepositoryBase<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context) { }

        public IEnumerable<User> GetAllUsers(bool trackChanges) =>
            FindAll(trackChanges).ToList();

        public IEnumerable<User> GetByIds(IEnumerable<int> ids, bool trackChanges) =>
            FindByCondition(u => ids.Contains(u.Id), trackChanges).ToList();

        public User? GetUser(int id, bool trackChanges) =>
            FindByCondition(u => u.Id == id, trackChanges).FirstOrDefault();

        public void CreateUser(User user) => Create(user);
    }
}