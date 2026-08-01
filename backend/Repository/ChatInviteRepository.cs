using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;

namespace Repository
{
    public class ChatInviteRepository : RepositoryBase<ChatInvite>, IChatInviteRepository
    {
        public ChatInviteRepository(AppDbContext context) : base(context) { }

        public async Task<ChatInvite?> GetActiveByChatAsync(int chatId, DateTime now, bool trackChanges) =>
            await ActiveByChat(chatId, now, trackChanges)
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefaultAsync();

        public async Task<IEnumerable<ChatInvite>> GetActiveByChatForRevokeAsync(int chatId, DateTime now) =>
            await ActiveByChat(chatId, now, trackChanges: true).ToListAsync();

        public async Task<ChatInvite?> GetByCodeAsync(string code, bool trackChanges) =>
            await FindByCondition(i => i.Code == code, trackChanges)
                .Include(i => i.Chat)
                .FirstOrDefaultAsync();

        public void CreateInvite(ChatInvite invite) => Create(invite);

        private IQueryable<ChatInvite> ActiveByChat(int chatId, DateTime now, bool trackChanges) =>
            FindByCondition(
                i => i.ChatId == chatId && i.RevokedAt == null &&
                     (i.ExpiresAt == null || i.ExpiresAt > now),
                trackChanges);
    }
}
