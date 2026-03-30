using Contracts;
using Entities.Models;

namespace internship.Repository
{
    public class MessageRepository : RepositoryBase<Message>, IMessageRepository
    {
        public MessageRepository(AppDbContext context) : base(context) { }

        public IEnumerable<Message> GetAllMessages(bool trackChanges) =>
            FindAll(trackChanges).ToList();

        public Message? GetMessage(int id, bool trackChanges) =>
            FindByCondition(m => m.Id == id, trackChanges).FirstOrDefault();

        public void CreateMessage(Message message) => Create(message);
        public void DeleteMessage(Message message) => Delete(message);
    }
}