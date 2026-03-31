using Repository.Interfaces;
using Entities.Models;

namespace Repository
{
    public class MessageRepository : RepositoryBase<Message>, IMessageRepository
    {
        public MessageRepository(AppDbContext context) : base(context) { }

        public IEnumerable<Message> GetAllMessages(bool trackChanges) =>
            FindAll(trackChanges).ToList();

    }
}