using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;
using Entities.RequestFeatures;

namespace Repository
{
    public class ChatRepository : RepositoryBase<Chat>, IChatRepository
    {
        public ChatRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<Chat>> GetAllChatsAsync(ChatParameters chatParameters, bool trackChanges) =>
            await FindAll(trackChanges)
                .Skip((chatParameters.PageNumber - 1) * chatParameters.PageSize)
                .Take(chatParameters.PageSize)
                .ToListAsync();

        public async Task<Chat?> GetChatAsync(int id, bool trackChanges) =>
            await FindByCondition(c => c.Id == id, trackChanges).FirstOrDefaultAsync();

        public void CreateChat(Chat chat) => Create(chat);

        public void DeleteChat(Chat chat) => Delete(chat);
    }
}