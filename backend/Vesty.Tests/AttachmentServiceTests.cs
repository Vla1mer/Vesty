using System.Text;
using Entities.Models;
using Moq;
using Repository.Interfaces;
using Services;
using Services.Interfaces;
using Services.Storage;
using Shared.Exceptions;

namespace Vesty.Tests
{
    public class AttachmentServiceTests
    {
        private const int CurrentUserId = 1;
        private const int OtherUserId = 2;
        private const int ChatId = 10;

        private readonly Mock<IRepositoryManager> _repository = new();
        private readonly Mock<IAttachmentRepository> _attachments = new();
        private readonly Mock<IMessageRepository> _messages = new();
        private readonly Mock<ICurrentUserService> _currentUser = new();
        private readonly Mock<IFileStorage> _storage = new();

        private readonly AttachmentService _service;

        public AttachmentServiceTests()
        {
            _repository.SetupGet(r => r.Attachment).Returns(_attachments.Object);
            _repository.SetupGet(r => r.Message).Returns(_messages.Object);
            _currentUser.SetupGet(u => u.UserId).Returns(CurrentUserId);
            _storage.Setup(s => s.PutAsync(It.IsAny<byte[]>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync("2026/07/29/key");

            IsMember(true);

            _service = new AttachmentService(_repository.Object, _currentUser.Object, _storage.Object);
        }

        private void IsMember(bool member) =>
            _currentUser.Setup(u => u.GetMembershipAsync(ChatId))
                .ReturnsAsync(member ? new ChatMember { ChatId = ChatId, UserId = CurrentUserId } : null);

        private static Stream FileOf(int size) => new MemoryStream(new byte[size]);

        [Fact]
        public async Task UploadAsync_ForForeignChat_Throws()
        {
            IsMember(false);

            await Assert.ThrowsAsync<ChatAccessDeniedException>(() =>
                _service.UploadAsync(ChatId, FileOf(10), "note.txt", "text/plain", 10));
        }

        [Theory]
        [InlineData("virus.exe")]
        [InlineData("script.bat")]
        [InlineData("installer.msi")]
        [InlineData("run.sh")]
        public async Task UploadAsync_WithExecutable_Throws(string fileName)
        {
            await Assert.ThrowsAsync<InvalidAttachmentException>(() =>
                _service.UploadAsync(ChatId, FileOf(10), fileName, "application/octet-stream", 10));
        }

        [Fact]
        public async Task UploadAsync_WithEmptyFile_Throws()
        {
            await Assert.ThrowsAsync<InvalidAttachmentException>(() =>
                _service.UploadAsync(ChatId, FileOf(0), "empty.txt", "text/plain", 0));
        }

        [Fact]
        public async Task UploadAsync_WhenTooLarge_Throws()
        {
            const long tooLarge = 10L * 1024 * 1024 + 1;

            await Assert.ThrowsAsync<InvalidAttachmentException>(() =>
                _service.UploadAsync(ChatId, FileOf(1), "big.bin", "application/octet-stream", tooLarge));
        }

        [Fact]
        public async Task UploadAsync_StoresFileAndSaves()
        {
            var result = await _service.UploadAsync(ChatId, FileOf(64), "report.pdf", "application/pdf", 64);

            _storage.Verify(s => s.PutAsync(
                It.Is<byte[]>(b => b.Length == 64), "application/pdf", It.IsAny<CancellationToken>()), Times.Once);
            _attachments.Verify(r => r.CreateAttachment(It.Is<MessageAttachment>(a =>
                a.UserId == CurrentUserId &&
                a.StorageKey == "2026/07/29/key" &&
                a.FileName == "report.pdf" &&
                a.MessageId == null)), Times.Once);
            _repository.Verify(r => r.SaveAsync(), Times.Once);
            Assert.Equal("report.pdf", result.FileName);
        }

        [Fact]
        public async Task UploadAsync_StripsDirectoryFromFileName()
        {
            var result = await _service.UploadAsync(
                ChatId, FileOf(8), @"C:\secrets\payroll.xlsx", "application/vnd.ms-excel", 8);

            Assert.Equal("payroll.xlsx", result.FileName);
        }

        [Fact]
        public async Task DownloadAsync_ForMissingAttachment_Throws()
        {
            _attachments.Setup(r => r.GetAttachmentAsync(99, false)).ReturnsAsync((MessageAttachment?)null);

            await Assert.ThrowsAsync<AttachmentNotFoundException>(() => _service.DownloadAsync(99));
        }

        [Fact]
        public async Task DownloadAsync_ForUnclaimedAttachmentOfAnotherUser_Throws()
        {
            _attachments.Setup(r => r.GetAttachmentAsync(5, false))
                .ReturnsAsync(new MessageAttachment { Id = 5, UserId = OtherUserId, MessageId = null });

            await Assert.ThrowsAsync<AttachmentNotFoundException>(() => _service.DownloadAsync(5));
        }

        [Fact]
        public async Task DownloadAsync_WhenCallerIsNotChatMember_Throws()
        {
            _attachments.Setup(r => r.GetAttachmentAsync(5, false))
                .ReturnsAsync(new MessageAttachment { Id = 5, UserId = OtherUserId, MessageId = 7, StorageKey = "k" });
            _messages.Setup(r => r.GetMessageAsync(7, false))
                .ReturnsAsync(new Message { Id = 7, ChatId = ChatId });
            IsMember(false);

            await Assert.ThrowsAsync<ChatAccessDeniedException>(() => _service.DownloadAsync(5));
        }

        [Fact]
        public async Task DownloadAsync_ReturnsContentForChatMember()
        {
            var bytes = Encoding.UTF8.GetBytes("file body");
            _attachments.Setup(r => r.GetAttachmentAsync(5, false))
                .ReturnsAsync(new MessageAttachment
                {
                    Id = 5, UserId = OtherUserId, MessageId = 7,
                    StorageKey = "k", ContentType = "text/plain", FileName = "note.txt"
                });
            _messages.Setup(r => r.GetMessageAsync(7, false))
                .ReturnsAsync(new Message { Id = 7, ChatId = ChatId });
            _storage.Setup(s => s.GetAsync("k", It.IsAny<CancellationToken>())).ReturnsAsync(bytes);

            var (content, contentType, fileName) = await _service.DownloadAsync(5);

            Assert.Equal(bytes, content);
            Assert.Equal("text/plain", contentType);
            Assert.Equal("note.txt", fileName);
        }

        [Fact]
        public async Task ClaimForMessageAsync_WithNoIds_ReturnsEmpty()
        {
            Assert.Empty(await _service.ClaimForMessageAsync([], 1));
        }

        [Fact]
        public async Task ClaimForMessageAsync_WhenTooMany_Throws()
        {
            var ids = Enumerable.Range(1, 11).ToList();

            await Assert.ThrowsAsync<InvalidAttachmentException>(() =>
                _service.ClaimForMessageAsync(ids, 1));
        }

        [Fact]
        public async Task ClaimForMessageAsync_WhenSomeMissing_Throws()
        {
            _attachments.Setup(r => r.GetByIdsAsync(It.IsAny<IEnumerable<int>>(), true))
                .ReturnsAsync([new MessageAttachment { Id = 1, UserId = CurrentUserId }]);

            await Assert.ThrowsAsync<InvalidAttachmentException>(() =>
                _service.ClaimForMessageAsync([1, 2], 5));
        }

        [Fact]
        public async Task ClaimForMessageAsync_ForAnotherUsersAttachment_Throws()
        {
            _attachments.Setup(r => r.GetByIdsAsync(It.IsAny<IEnumerable<int>>(), true))
                .ReturnsAsync([new MessageAttachment { Id = 1, UserId = OtherUserId }]);

            await Assert.ThrowsAsync<InvalidAttachmentException>(() =>
                _service.ClaimForMessageAsync([1], 5));
        }

        [Fact]
        public async Task ClaimForMessageAsync_ForAlreadyAttachedFile_Throws()
        {
            _attachments.Setup(r => r.GetByIdsAsync(It.IsAny<IEnumerable<int>>(), true))
                .ReturnsAsync([new MessageAttachment { Id = 1, UserId = CurrentUserId, MessageId = 3 }]);

            await Assert.ThrowsAsync<InvalidAttachmentException>(() =>
                _service.ClaimForMessageAsync([1], 5));
        }

        [Fact]
        public async Task ClaimForMessageAsync_LinksAttachmentsToMessage()
        {
            var first = new MessageAttachment { Id = 1, UserId = CurrentUserId };
            var second = new MessageAttachment { Id = 2, UserId = CurrentUserId };
            _attachments.Setup(r => r.GetByIdsAsync(It.IsAny<IEnumerable<int>>(), true))
                .ReturnsAsync([first, second]);

            var claimed = await _service.ClaimForMessageAsync([1, 2], 5);

            Assert.Equal(2, claimed.Count());
            Assert.Equal(5, first.MessageId);
            Assert.Equal(5, second.MessageId);
        }
    }
}
