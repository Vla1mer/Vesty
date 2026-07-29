using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;

namespace Repository
{
    public class AttachmentRepository : RepositoryBase<MessageAttachment>, IAttachmentRepository
    {
        public AttachmentRepository(AppDbContext context) : base(context) { }

        public async Task<MessageAttachment?> GetAttachmentAsync(int id, bool trackChanges) =>
            await FindByCondition(a => a.Id == id, trackChanges).FirstOrDefaultAsync();

        public async Task<IEnumerable<MessageAttachment>> GetByIdsAsync(IEnumerable<int> ids, bool trackChanges)
        {
            var list = ids.ToList();
            if (list.Count == 0)
                return [];

            return await FindByCondition(a => list.Contains(a.Id), trackChanges).ToListAsync();
        }

        public async Task<IEnumerable<MessageAttachment>> GetByMessageIdsAsync(IEnumerable<int> messageIds)
        {
            var list = messageIds.ToList();
            if (list.Count == 0)
                return [];

            return await FindByCondition(
                    a => a.MessageId != null && list.Contains(a.MessageId.Value),
                    trackChanges: false)
                .OrderBy(a => a.Id)
                .ToListAsync();
        }

        public void CreateAttachment(MessageAttachment attachment) => Create(attachment);
    }
}
