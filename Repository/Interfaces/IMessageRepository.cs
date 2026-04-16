using Entities.Models;

namespace Repository.Interfaces
{
    public interface IMessageRepository
    {
        Task<IEnumerable<Message>> GetAllMessagesAsync(bool trackChanges);
        Task<IEnumerable<Message>> GetMessagesByChatAsync(int chatId, bool trackChanges);
        Task<Message?> GetMessageAsync(int id, bool trackChanges);
        void CreateMessage(Message message);
        void CreateMessageForChat(int chatId, Message message);
        void DeleteMessage(Message message );
    }
}