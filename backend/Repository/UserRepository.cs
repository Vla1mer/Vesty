using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;
using Shared.RequestFeatures;
using Repository.Extensions;

namespace Repository
{
    public class UserRepository : RepositoryBase<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context) { }

        public async Task<PagedList<User>> GetAllUsersAsync(UserParameters userParameters, bool trackChanges)
        {
            var query = FindAll(trackChanges);

            if (userParameters.ExcludedUserIds.Count > 0)
                query = query.Where(u => !userParameters.ExcludedUserIds.Contains(u.Id));

            var users = await query
                .FilterByBirthday(userParameters.MinBirthday, userParameters.MaxBirthday)
                .FilterByPhone(userParameters.HasPhone)
                .Search(userParameters.SearchTerm)
                .Sort(userParameters.OrderBy)
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