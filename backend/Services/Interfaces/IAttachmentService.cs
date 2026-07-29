using Entities.Models;
using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IAttachmentService
    {
        Task<MessageAttachmentDto> UploadAsync(int chatId, Stream content, string? fileName,
            string? contentType, long length);
        Task<(byte[] content, string contentType, string fileName)> DownloadAsync(int attachmentId);
        Task<IReadOnlyList<MessageAttachment>> ReserveAsync(IEnumerable<int> attachmentIds);
        Task DeleteForMessageAsync(int messageId);
        Task DeleteUnclaimedAsync(int attachmentId);
        Task<int> RemoveAbandonedAsync(TimeSpan olderThan);
    }
}
