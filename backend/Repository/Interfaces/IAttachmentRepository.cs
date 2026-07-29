using Entities.Models;

namespace Repository.Interfaces
{
    public interface IAttachmentRepository
    {
        Task<MessageAttachment?> GetAttachmentAsync(int id, bool trackChanges);
        Task<IEnumerable<MessageAttachment>> GetByIdsAsync(IEnumerable<int> ids, bool trackChanges);
        Task<IEnumerable<MessageAttachment>> GetByMessageIdsAsync(IEnumerable<int> messageIds);
        void CreateAttachment(MessageAttachment attachment);
    }
}
