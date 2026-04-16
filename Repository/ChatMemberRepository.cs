using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;

namespace Repository
{
    public class ChatMemberRepository : RepositoryBase<ChatMember>, IChatMemberRepository
    {
        public ChatMemberRepository(AppDbContext context) : base(context) { }

        public async Task<ChatMember?> GetMemberAsync(int chatId, int userId, bool trackChanges) =>
            await FindByCondition(cm => cm.ChatId == chatId && cm.UserId == userId, trackChanges)
                .FirstOrDefaultAsync();

        public async Task<IEnumerable<User>> GetUsersByChatIdAsync(int chatId, bool trackChanges) =>
            await FindByCondition(cm => cm.ChatId == chatId, trackChanges)
                .Include(cm => cm.User)
                .Select(cm => cm.User)
                .ToListAsync();

        public void CreateMember(ChatMember member) => Create(member);

        public void DeleteMember(ChatMember member) => Delete(member);
    }
}