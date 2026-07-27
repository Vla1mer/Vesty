using Entities.Models;

namespace Repository.Interfaces
{
    public interface IChatAvatarRepository
    {
        Task<ChatAvatar?> GetAvatarAsync(int chatId, bool trackChanges);
        void CreateAvatar(ChatAvatar avatar);
        void DeleteAvatar(ChatAvatar avatar);
    }
}
