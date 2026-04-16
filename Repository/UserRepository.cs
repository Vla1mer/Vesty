using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;
using Entities.RequestFeatures;

namespace Repository
{
    public class UserRepository : RepositoryBase<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<User>> GetAllUsersAsync(UserParameters userParameters, bool trackChanges) =>
            await FindAll(trackChanges)
                .Skip((userParameters.PageNumber - 1) * userParameters.PageSize)
                .Take(userParameters.PageSize)
                .ToListAsync();

        public async Task<IEnumerable<User>> GetByIdsAsync(IEnumerable<int> ids, bool trackChanges) =>
            await FindByCondition(u => ids.Contains(u.Id), trackChanges).ToListAsync();

        public async Task<User?> GetUserAsync(int id, bool trackChanges) =>
            await FindByCondition(u => u.Id == id, trackChanges).FirstOrDefaultAsync();

        public void CreateUser(User user) => Create(user);

        public void DeleteUser(User user) => Delete(user);
    }
}