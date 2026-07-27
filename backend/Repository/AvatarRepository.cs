using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;

namespace Repository
{
    public class AvatarRepository : RepositoryBase<UserAvatar>, IAvatarRepository
    {
        public AvatarRepository(AppDbContext context) : base(context) { }

        public async Task<UserAvatar?> GetAvatarAsync(int userId, bool trackChanges) =>
            await FindByCondition(a => a.UserId == userId, trackChanges).FirstOrDefaultAsync();

        public void CreateAvatar(UserAvatar avatar) => Create(avatar);

        public void DeleteAvatar(UserAvatar avatar) => Delete(avatar);
    }
}
