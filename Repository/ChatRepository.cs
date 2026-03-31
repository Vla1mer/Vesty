using Repository.Interfaces;
using Entities.Models;

namespace Repository
{
    public class ChatRepository : RepositoryBase<Chat>, IChatRepository
    {
        public ChatRepository(AppDbContext context) : base(context) { }

        public IEnumerable<Chat> GetAllChats(bool trackChanges) =>
            FindAll(trackChanges).ToList();

    }
}