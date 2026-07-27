using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;
using Shared.RequestFeatures;

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

        public async Task<IEnumerable<ChatMember>> GetMembersByChatIdAsync(int chatId, bool trackChanges) =>
            await FindByCondition(cm => cm.ChatId == chatId, trackChanges)
                .Include(cm => cm.User)
                .ToListAsync();

        public async Task<Dictionary<int, DirectChatPartner>> GetDirectChatPartnersAsync(IEnumerable<int> chatIds, int currentUserId)
        {
            var ids = chatIds.ToList();
            if (ids.Count == 0)
                return new Dictionary<int, DirectChatPartner>();

            var pairs = await FindByCondition(
                    cm => ids.Contains(cm.ChatId) && cm.UserId != currentUserId,
                    trackChanges: false)
                .Include(cm => cm.User)
                .Select(cm => new
                {
                    cm.ChatId,
                    Partner = new DirectChatPartner
                    {
                        UserId = cm.UserId,
                        UserName = cm.User.UserName,
                        AvatarUpdatedAt = cm.User.AvatarUpdatedAt
                    }
                })
                .ToListAsync();

            return pairs
                .Where(p => p.Partner.UserName != null)
                .GroupBy(p => p.ChatId)
                .ToDictionary(g => g.Key, g => g.First().Partner);
        }

        public void CreateMember(ChatMember member) => Create(member);

        public void DeleteMember(ChatMember member) => Delete(member);
    }
}
