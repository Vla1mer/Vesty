using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;

namespace Repository
{
    public class ChatRepository : RepositoryBase<Chat>, IChatRepository
    {
        public ChatRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<Chat>> GetAllChatsAsync(bool trackChanges) =>
            await FindAll(trackChanges).ToListAsync();

        public async Task<Chat?> GetChatAsync(int id, bool trackChanges) =>
            await FindByCondition(c => c.Id == id, trackChanges).FirstOrDefaultAsync();

        public void CreateChat(Chat chat) => Create(chat);

        public void DeleteChat(Chat chat) => Delete(chat);
    }
}