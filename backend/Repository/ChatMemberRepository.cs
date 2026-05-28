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

        public async Task<bool> IsUserInChatAsync(int chatId, int userId) =>
            await FindByCondition(cm => cm.ChatId == chatId && cm.UserId == userId, trackChanges: false)
                .AnyAsync();

        public async Task<IEnumerable<int>> GetChatIdsForUserAsync(int userId) =>
            await FindByCondition(cm => cm.UserId == userId, trackChanges: false)
                .Select(cm => cm.ChatId)
                .ToListAsync();

        public async Task<IEnumerable<User>> GetUsersByChatIdAsync(int chatId, bool trackChanges) =>
            await FindByCondition(cm => cm.ChatId == chatId, trackChanges)
                .Include(cm => cm.User)
                .Select(cm => cm.User)
                .ToListAsync();

        public async Task<Dictionary<int, string>> GetDirectChatPartnerNamesAsync(IEnumerable<int> chatIds, int currentUserId)
        {
            var ids = chatIds.ToList();
            if (ids.Count == 0)
                return new Dictionary<int, string>();

            var pairs = await FindByCondition(
                    cm => ids.Contains(cm.ChatId) && cm.UserId != currentUserId,
                    trackChanges: false)
                .Include(cm => cm.User)
                .Select(cm => new { cm.ChatId, cm.User.UserName })
                .ToListAsync();

            return pairs
                .Where(p => p.UserName != null)
                .GroupBy(p => p.ChatId)
                .ToDictionary(g => g.Key, g => g.First().UserName!);
        }

        public void CreateMember(ChatMember member) => Create(member);

        public void DeleteMember(ChatMember member) => Delete(member);
    }
}
