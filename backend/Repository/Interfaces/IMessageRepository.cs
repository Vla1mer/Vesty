using Entities.Models;
using Shared.RequestFeatures;

namespace Repository.Interfaces
{
    public interface IMessageRepository
    {
        Task<PagedList<Message>> GetAllMessagesAsync(MessageParameters messageParameters, int viewerUserId, bool trackChanges);
        Task<IEnumerable<Message>> GetMessagesByChatAsync(int chatId, bool trackChanges);
        Task<IEnumerable<Message>> GetMessagesByChatAsync(int chatId, DateTime? clearedAt, bool trackChanges);
        Task<IEnumerable<Message>> GetLastMessagesByChatIdsAsync(IEnumerable<int> chatIds, int viewerUserId);
        Task<Dictionary<int, int>> GetUnreadCountsAsync(int userId, IEnumerable<int> chatIds);
        Task<Message?> GetMessageAsync(int id, bool trackChanges);
        void CreateMessage(Message message);
        void CreateMessageForChat(int chatId, Message message);
        void DeleteMessage(Message message );
    }
}
