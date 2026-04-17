using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;
using Entities.RequestFeatures;
using Repository.Extensions;

namespace Repository
{
    public class UserRepository : RepositoryBase<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context) { }

        public async Task<PagedList<User>> GetAllUsersAsync(UserParameters userParameters, bool trackChanges)
        {
            var users = await FindAll(trackChanges)
                .FilterByBirthday(userParameters.MinBirthday, userParameters.MaxBirthday)
                .FilterByPhone(userParameters.HasPhone)
                .Search(userParameters.SearchTerm)
                .OrderBy(u => u.Login)
                .ToListAsync();

            return PagedList<User>.ToPagedList(users, userParameters.PageNumber, userParameters.PageSize);
        }

        public async Task<IEnumerable<User>> GetByIdsAsync(IEnumerable<int> ids, bool trackChanges) =>
            await FindByCondition(u => ids.Contains(u.Id), trackChanges).ToListAsync();

        public async Task<User?> GetUserAsync(int id, bool trackChanges) =>
            await FindByCondition(u => u.Id == id, trackChanges).FirstOrDefaultAsync();

        public void CreateUser(User user) => Create(user);

        public void DeleteUser(User user) => Delete(user);
    }
}