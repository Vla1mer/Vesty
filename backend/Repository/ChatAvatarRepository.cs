using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;

namespace Repository
{
    public class ChatAvatarRepository : RepositoryBase<ChatAvatar>, IChatAvatarRepository
    {
        public ChatAvatarRepository(AppDbContext context) : base(context) { }

        public async Task<ChatAvatar?> GetAvatarAsync(int chatId, bool trackChanges) =>
            await FindByCondition(a => a.ChatId == chatId, trackChanges).FirstOrDefaultAsync();

        public void CreateAvatar(ChatAvatar avatar) => Create(avatar);

        public void DeleteAvatar(ChatAvatar avatar) => Delete(avatar);
    }
}
