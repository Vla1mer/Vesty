using Entities.Models;

namespace Repository.Interfaces
{
    public interface IAttachmentRepository
    {
        Task<MessageAttachment?> GetAttachmentAsync(int id, bool trackChanges);
        Task<IEnumerable<MessageAttachment>> GetByIdsAsync(IEnumerable<int> ids, bool trackChanges);
        Task<IEnumerable<MessageAttachment>> GetByMessageIdsAsync(IEnumerable<int> messageIds);
        Task<IEnumerable<MessageAttachment>> GetUnclaimedOlderThanAsync(DateTime threshold);
        Task<IEnumerable<string>> GetStorageKeysOfUserAsync(int userId);
        Task<IEnumerable<string>> GetStorageKeysOfChatAsync(int chatId);
        void CreateAttachment(MessageAttachment attachment);
        void DeleteAttachment(MessageAttachment attachment);
    }
}
