using Contracts;
using Entities.Models;

namespace internship.Repository
{
    public class ChatRepository : RepositoryBase<Chat>, IChatRepository
    {
        public ChatRepository(AppDbContext context) : base(context) { }

        public IEnumerable<Chat> GetAllChats(bool trackChanges) =>
            FindAll(trackChanges).ToList();

        public Chat? GetChat(int id, bool trackChanges) =>
            FindByCondition(c => c.Id == id, trackChanges).FirstOrDefault();

        public void CreateChat(Chat chat) => Create(chat);
        public void DeleteChat(Chat chat) => Delete(chat);
        public void UpdateChat(Chat chat) => Update(chat);
    }
}