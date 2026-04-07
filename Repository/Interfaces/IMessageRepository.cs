using Entities.Models;

namespace Repository.Interfaces
{
    public interface IMessageRepository
    {
        IEnumerable<Message> GetAllMessages(bool trackChanges);
        IEnumerable<Message> GetMessagesByChat(int chatId, bool trackChanges);
        Message? GetMessage(int id, bool trackChanges);
        void CreateMessage(Message message);
        void CreateMessageForChat(int chatId, Message message);
    }
}