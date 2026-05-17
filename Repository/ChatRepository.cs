using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;
using Shared.RequestFeatures;
using Repository.Extensions;

namespace Repository
{
    public class ChatRepository : RepositoryBase<Chat>, IChatRepository
    {
        public ChatRepository(AppDbContext context) : base(context) { }

        public async Task<PagedList<Chat>> GetAllChatsAsync(ChatParameters chatParameters, IEnumerable<int> allowedChatIds, bool trackChanges)
        {
            var chats = await FindAll(trackChanges)
                .FilterByChatIds(allowedChatIds)
                .FilterByCreator(chatParameters.CreatorId)
                .Search(chatParameters.SearchTerm)
                .Sort(chatParameters.OrderBy)
                .ToListAsync();

            return PagedList<Chat>.ToPagedList(chats, chatParameters.PageNumber, chatParameters.PageSize);
        }

        public async Task<Chat?> GetChatAsync(int id, bool trackChanges) =>
            await FindByCondition(c => c.Id == id, trackChanges).FirstOrDefaultAsync();

        public async Task<Chat?> GetPrivateChatBetweenAsync(int userIdA, int userIdB) =>
            await FindByCondition(c => c.IsPrivate, trackChanges: false)
                .Where(c => c.ChatMembers.Any(cm => cm.UserId == userIdA)
                         && c.ChatMembers.Any(cm => cm.UserId == userIdB))
                .FirstOrDefaultAsync();

        public void CreateChat(Chat chat) => Create(chat);

        public void DeleteChat(Chat chat) => Delete(chat);
    }
}
