using Entities.Models;

namespace Repository.Interfaces
{
    public interface IAvatarRepository
    {
        Task<UserAvatar?> GetAvatarAsync(int userId, bool trackChanges);
        void CreateAvatar(UserAvatar avatar);
        void DeleteAvatar(UserAvatar avatar);
    }
}
