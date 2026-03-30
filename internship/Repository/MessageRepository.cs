using Contracts;
using Entities.Models;

namespace internship.Repository
{
    public class MessageRepository : RepositoryBase<Message>, IMessageRepository
    {
        public MessageRepository(AppDbContext context) : base(context) { }

        public IEnumerable<Message> GetAllMessages(bool trackChanges) =>
            FindAll(trackChanges).ToList();

    }
}