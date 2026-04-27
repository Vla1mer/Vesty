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

        public async Task<PagedList<Chat>> GetAllChatsAsync(ChatParameters chatParameters, bool trackChanges)
        {
            var chats = await FindAll(trackChanges)
                .FilterByCreator(chatParameters.CreatorId)
                .Search(chatParameters.SearchTerm)
                .Sort(chatParameters.OrderBy)
                .ToListAsync();

            return PagedList<Chat>.ToPagedList(chats, chatParameters.PageNumber, chatParameters.PageSize);
        }

        public async Task<Chat?> GetChatAsync(int id, bool trackChanges) =>
            await FindByCondition(c => c.Id == id, trackChanges).FirstOrDefaultAsync();

        public void CreateChat(Chat chat) => Create(chat);

        public void DeleteChat(Chat chat) => Delete(chat);
    }
}