using AutoMapper;
using Entities.Models;
using Moq;
using Repository.Interfaces;
using Services;
using Services.Cryptography;
using Services.DataTransferObjects;
using Services.Interfaces;
using Shared.Exceptions;

namespace Vesty.Tests
{
    public class ClearChatTests
    {
        private const int CurrentUserId = 1;
        private const int ChatId = 10;

        private readonly Mock<IRepositoryManager> _repository = new();
        private readonly Mock<IChatRepository> _chats = new();
        private readonly Mock<IChatMemberRepository> _members = new();
        private readonly Mock<IMessageRepository> _messages = new();
        private readonly Mock<IReactionRepository> _reactions = new();
        private readonly Mock<IAttachmentRepository> _attachments = new();
        private readonly Mock<ICurrentUserService> _currentUser = new();
        private readonly Mock<ILoggerManager> _logger = new();
        private readonly Mock<IMapper> _mapper = new();
        private readonly Mock<IMessageCipher> _cipher = new();
        private readonly Mock<IChatNotifier> _notifier = new();
        private readonly Mock<IChatService> _chatService = new();
        private readonly Mock<IAttachmentService> _attachmentService = new();

        private readonly ChatService _service;
        private readonly MessageService _messageService;

        public ClearChatTests()
        {
            _repository.SetupGet(r => r.Chat).Returns(_chats.Object);
            _repository.SetupGet(r => r.ChatMember).Returns(_members.Object);
            _repository.SetupGet(r => r.Message).Returns(_messages.Object);
            _repository.SetupGet(r => r.Reaction).Returns(_reactions.Object);
            _repository.SetupGet(r => r.Attachment).Returns(_attachments.Object);
            _currentUser.SetupGet(u => u.UserId).Returns(CurrentUserId);

            _chats.Setup(r => r.GetChatAsync(ChatId, It.IsAny<bool>()))
                .ReturnsAsync(new Chat { Id = ChatId, IsPrivate = true });
            _cipher.Setup(c => c.Decrypt(It.IsAny<string>())).Returns((string v) => v);
            _reactions.Setup(r => r.GetByMessageIdsAsync(It.IsAny<IEnumerable<int>>()))
                .ReturnsAsync([]);
            _attachments.Setup(r => r.GetByMessageIdsAsync(It.IsAny<IEnumerable<int>>()))
                .ReturnsAsync([]);

            _service = new ChatService(_repository.Object, _logger.Object, _mapper.Object,
                _currentUser.Object, _notifier.Object, _cipher.Object);
            _messageService = new MessageService(_repository.Object, _logger.Object, _mapper.Object,
                _cipher.Object, _currentUser.Object, _chatService.Object, _notifier.Object,
                _attachmentService.Object);
        }

        [Fact]
        public async Task ClearForCurrentUserAsync_StampsTheMember()
        {
            var member = new ChatMember { ChatId = ChatId, UserId = CurrentUserId };
            _members.Setup(r => r.GetMemberAsync(ChatId, CurrentUserId, true)).ReturnsAsync(member);

            await _service.ClearForCurrentUserAsync(ChatId);

            Assert.NotNull(member.ClearedAt);
            _repository.Verify(r => r.SaveAsync(), Times.Once);
        }

        [Fact]
        public async Task ClearForCurrentUserAsync_DoesNotDeleteTheChat()
        {
            _members.Setup(r => r.GetMemberAsync(ChatId, CurrentUserId, true))
                .ReturnsAsync(new ChatMember { ChatId = ChatId, UserId = CurrentUserId });

            await _service.ClearForCurrentUserAsync(ChatId);

            _chats.Verify(r => r.DeleteChat(It.IsAny<Chat>()), Times.Never);
            _notifier.Verify(n => n.ChatDeletedAsync(
                It.IsAny<IEnumerable<int>>(), It.IsAny<ChatDeletedSignalrDto>()), Times.Never);
        }

        [Fact]
        public async Task ClearForCurrentUserAsync_ForNonMember_Throws()
        {
            _members.Setup(r => r.GetMemberAsync(ChatId, CurrentUserId, true))
                .ReturnsAsync((ChatMember?)null);

            await Assert.ThrowsAsync<ChatAccessDeniedException>(() =>
                _service.ClearForCurrentUserAsync(ChatId));
        }

        [Fact]
        public async Task GetMessagesByChatAsync_PassesTheMarkerToTheQuery()
        {
            var clearedAt = new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc);
            _currentUser.Setup(u => u.GetMembershipAsync(ChatId))
                .ReturnsAsync(new ChatMember { ChatId = ChatId, UserId = CurrentUserId, ClearedAt = clearedAt });
            _messages.Setup(r => r.GetMessagesByChatAsync(ChatId, clearedAt, false))
                .ReturnsAsync([]);

            await _messageService.GetMessagesByChatAsync(ChatId, trackChanges: false);

            _messages.Verify(r => r.GetMessagesByChatAsync(ChatId, clearedAt, false), Times.Once);
        }

        [Fact]
        public async Task GetMessagesByChatAsync_WithoutMarker_PassesNull()
        {
            _currentUser.Setup(u => u.GetMembershipAsync(ChatId))
                .ReturnsAsync(new ChatMember { ChatId = ChatId, UserId = CurrentUserId });
            _messages.Setup(r => r.GetMessagesByChatAsync(ChatId, null, false)).ReturnsAsync([]);

            await _messageService.GetMessagesByChatAsync(ChatId, trackChanges: false);

            _messages.Verify(r => r.GetMessagesByChatAsync(ChatId, null, false), Times.Once);
        }
    }
}
