using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;
using Shared.RequestFeatures;
using Repository.Extensions;

namespace Repository
{
    public class MessageRepository : RepositoryBase<Message>, IMessageRepository
    {
        public MessageRepository(AppDbContext context) : base(context) { }

        public async Task<PagedList<Message>> GetAllMessagesAsync(MessageParameters messageParameters, int viewerUserId, bool trackChanges)
        {
            var messages = await FindAll(trackChanges)
                .Where(m => RepositoryContext.Set<ChatMember>().Any(cm =>
                    cm.ChatId == m.ChatId && cm.UserId == viewerUserId &&
                    (cm.ClearedAt == null || m.CreatedAt > cm.ClearedAt)))
                .FilterByCreatedAt(messageParameters.MinCreatedAt, messageParameters.MaxCreatedAt)
                .FilterByChatId(messageParameters.ChatId)
                .FilterByUserId(messageParameters.UserId)
                .Search(messageParameters.SearchTerm)
                .Sort(messageParameters.OrderBy)
                .ToListAsync();

            return PagedList<Message>.ToPagedList(messages, messageParameters.PageNumber, messageParameters.PageSize);
        }

        public async Task<IEnumerable<Message>> GetLastMessagesByChatIdsAsync(
            IEnumerable<int> chatIds, int viewerUserId) =>
            await FindByCondition(m => chatIds.Contains(m.ChatId), trackChanges: false)
                .Where(m => RepositoryContext.Set<ChatMember>().Any(cm =>
                    cm.ChatId == m.ChatId && cm.UserId == viewerUserId &&
                    (cm.ClearedAt == null || m.CreatedAt > cm.ClearedAt)))
                .Where(m => !RepositoryContext.Set<Message>().Any(x =>
                    x.ChatId == m.ChatId &&
                    (x.CreatedAt > m.CreatedAt ||
                        (x.CreatedAt == m.CreatedAt && x.Id > m.Id))))
                .Include(m => m.User)
                .ToListAsync();

        public async Task<Dictionary<int, int>> GetUnreadCountsAsync(int userId, IEnumerable<int> chatIds)
        {
            var counts = await FindByCondition(m => chatIds.Contains(m.ChatId) && m.UserId != userId, trackChanges: false)
                .Where(m => RepositoryContext.Set<ChatMember>().Any(cm =>
                    cm.ChatId == m.ChatId && cm.UserId == userId &&
                    (cm.LastReadAt == null || m.CreatedAt > cm.LastReadAt) &&
                    (cm.ClearedAt == null || m.CreatedAt > cm.ClearedAt)))
                .GroupBy(m => m.ChatId)
                .Select(g => new { ChatId = g.Key, Count = g.Count() })
                .ToListAsync();

            return counts.ToDictionary(x => x.ChatId, x => x.Count);
        }

        public async Task<Message?> GetMessageAsync(int id, bool trackChanges) =>
            await FindByCondition(m => m.Id == id, trackChanges)
                .Include(m => m.User)
                .FirstOrDefaultAsync();

        public async Task<IEnumerable<Message>> GetMessagesByChatAsync(int chatId, bool trackChanges) =>
            await GetMessagesByChatAsync(chatId, clearedAt: null, trackChanges);

        public async Task<IEnumerable<Message>> GetMessagesByChatAsync(
            int chatId, DateTime? clearedAt, bool trackChanges) =>
            await FindByCondition(m => m.ChatId == chatId, trackChanges)
                .Where(m => clearedAt == null || m.CreatedAt > clearedAt)
                .OrderBy(m => m.CreatedAt)
                .ThenBy(m => m.Id)
                .ToListAsync();

        public void CreateMessage(Message message) => Create(message);

        public void CreateMessageForChat(int chatId, Message message)
        {
            message.ChatId = chatId;
            Create(message);
        }

        public void DeleteMessage(Message message) => Delete(message);
    }
}
