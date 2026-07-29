using Entities.Models;
using Repository.Interfaces;
using Services.DataTransferObjects;
using Services.Interfaces;
using Services.Storage;
using Shared.Exceptions;

namespace Services
{
    public class AttachmentService : IAttachmentService
    {
        private readonly IRepositoryManager _repository;
        private readonly ICurrentUserService _currentUser;
        private readonly IFileStorage _storage;

        public AttachmentService(IRepositoryManager repository, ICurrentUserService currentUser,
            IFileStorage storage)
        {
            _repository = repository;
            _currentUser = currentUser;
            _storage = storage;
        }

        public async Task<MessageAttachmentDto> UploadAsync(int chatId, Stream content,
            string? fileName, string? contentType, long length)
        {
            await EnsureCallerIsChatMemberAsync(chatId);

            var name = AttachmentContent.NormalizeFileName(fileName);
            AttachmentContent.EnsureValid(name, length);

            var data = await AttachmentContent.ReadAsync(content);
            var key = await _storage.PutAsync(data, contentType ?? "application/octet-stream");

            var attachment = new MessageAttachment
            {
                UserId = _currentUser.UserId,
                StorageKey = key,
                FileName = name,
                ContentType = contentType ?? "application/octet-stream",
                SizeInBytes = data.Length
            };

            _repository.Attachment.CreateAttachment(attachment);
            await _repository.SaveAsync();

            return ToDto(attachment);
        }

        public async Task<(byte[] content, string contentType, string fileName)> DownloadAsync(int attachmentId)
        {
            var attachment = await _repository.Attachment.GetAttachmentAsync(attachmentId, trackChanges: false);
            if (attachment is null)
                throw new AttachmentNotFoundException(attachmentId);

            if (attachment.MessageId is null)
            {
                if (attachment.UserId != _currentUser.UserId)
                    throw new AttachmentNotFoundException(attachmentId);
            }
            else
            {
                var message = await _repository.Message.GetMessageAsync(attachment.MessageId.Value, trackChanges: false);
                if (message is null)
                    throw new AttachmentNotFoundException(attachmentId);

                await EnsureCallerIsChatMemberAsync(message.ChatId);
            }

            var data = await _storage.GetAsync(attachment.StorageKey);
            return (data, attachment.ContentType, attachment.FileName);
        }

        public async Task<IReadOnlyList<MessageAttachment>> ReserveAsync(IEnumerable<int> attachmentIds)
        {
            var ids = attachmentIds.Distinct().ToList();
            if (ids.Count == 0)
                return [];

            if (ids.Count > AttachmentContent.MaxPerMessage)
                throw new InvalidAttachmentException(
                    $"a message can hold at most {AttachmentContent.MaxPerMessage} attachments.");

            var attachments = (await _repository.Attachment.GetByIdsAsync(ids, trackChanges: true)).ToList();

            if (attachments.Count != ids.Count)
                throw new InvalidAttachmentException("some attachments were not found.");

            foreach (var attachment in attachments)
            {
                if (attachment.UserId != _currentUser.UserId || attachment.MessageId is not null)
                    throw new InvalidAttachmentException("attachment is not available.");
            }

            return attachments;
        }

        public async Task DeleteForMessageAsync(int messageId)
        {
            var attachments = await _repository.Attachment.GetByMessageIdsAsync(new[] { messageId });

            foreach (var attachment in attachments)
            {
                try
                {
                    await _storage.DeleteAsync(attachment.StorageKey);
                }
                catch (Exception)
                {
                }
            }
        }

        public async Task DeleteUnclaimedAsync(int attachmentId)
        {
            var attachment = await _repository.Attachment.GetAttachmentAsync(attachmentId, trackChanges: true);
            if (attachment is null || attachment.UserId != _currentUser.UserId)
                throw new AttachmentNotFoundException(attachmentId);

            if (attachment.MessageId is not null)
                throw new InvalidAttachmentException("attachment is already sent.");

            await RemoveAsync(attachment);
            await _repository.SaveAsync();
        }

        public async Task<int> RemoveAbandonedAsync(TimeSpan olderThan)
        {
            var abandoned = (await _repository.Attachment
                .GetUnclaimedOlderThanAsync(DateTime.UtcNow - olderThan)).ToList();

            foreach (var attachment in abandoned)
                await RemoveAsync(attachment);

            if (abandoned.Count > 0)
                await _repository.SaveAsync();

            return abandoned.Count;
        }

        private async Task RemoveAsync(MessageAttachment attachment)
        {
            try
            {
                await _storage.DeleteAsync(attachment.StorageKey);
            }
            catch (Exception)
            {
            }

            _repository.Attachment.DeleteAttachment(attachment);
        }

        public static MessageAttachmentDto ToDto(MessageAttachment attachment) =>
            new MessageAttachmentDto
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                ContentType = attachment.ContentType,
                SizeInBytes = attachment.SizeInBytes
            };

        private async Task EnsureCallerIsChatMemberAsync(int chatId)
        {
            var membership = await _currentUser.GetMembershipAsync(chatId);
            if (membership is null)
                throw new ChatAccessDeniedException(chatId, _currentUser.UserId);
        }
    }
}
