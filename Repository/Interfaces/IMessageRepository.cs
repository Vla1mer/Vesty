using Entities.Models;
using Shared.RequestFeatures;

namespace Repository.Interfaces
{
    public interface IMessageRepository
    {
        Task<PagedList<Message>> GetAllMessagesAsync(MessageParameters messageParameters, bool trackChanges);
        Task<IEnumerable<Message>> GetMessagesByChatAsync(int chatId, bool trackChanges);
        Task<Message?> GetMessageAsync(int id, bool trackChanges);
        void CreateMessage(Message message);
        void CreateMessageForChat(int chatId, Message message);
        void DeleteMessage(Message message );
    }
}