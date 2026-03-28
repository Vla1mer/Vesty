using Contracts;
using Entities.Models;
using Microsoft.EntityFrameworkCore;

namespace internship.Repository
{
    public class UserRepository : RepositoryBase<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<User>> GetAllUsersAsync(bool trackChanges) =>
            await FindAll(trackChanges).ToListAsync();

        public async Task<User?> GetUserAsync(int id, bool trackChanges) =>
            await FindByCondition(u => u.Id == id, trackChanges).FirstOrDefaultAsync();

        public void CreateUser(User user) => Create(user);
        public void DeleteUser(User user) => Delete(user);
        public void UpdateUser(User user) => Update(user);
    }
}