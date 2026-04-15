using Repository.Interfaces;
using Entities.Models;

namespace Repository
{
    public class MessageRepository : RepositoryBase<Message>, IMessageRepository
    {
        public MessageRepository(AppDbContext context) : base(context) { }

        public IEnumerable<Message> GetAllMessages(bool trackChanges) =>
            FindAll(trackChanges).ToList();

        public Message? GetMessage(int id, bool trackChanges) =>
            FindByCondition(m => m.Id == id, trackChanges).FirstOrDefault();

        public IEnumerable<Message> GetMessagesByChat(int chatId, bool trackChanges) =>
            FindByCondition(m => m.ChatId == chatId, trackChanges).ToList();

        public void CreateMessage(Message message) => Create(message);

        public void CreateMessageForChat(int chatId, Message message)
        {
            message.ChatId = chatId;
            Create(message);
        }

        public void DeleteMessage(Message message) => Delete(message);
    }
}