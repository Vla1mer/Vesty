using AutoMapper;
using Entities.Models;
using Moq;
using Repository.Interfaces;
using Services;
using Services.Cryptography;
using Services.Interfaces;
using Shared.Exceptions;

namespace Vesty.Tests
{
    public class BlockedConversationTests
    {
        private const int CurrentUserId = 1;
        private const int PartnerId = 2;
        private const int ChatId = 10;

        private readonly Mock<IRepositoryManager> _repository = new();
        private readonly Mock<IChatRepository> _chats = new();
        private readonly Mock<IChatMemberRepository> _members = new();
        private readonly Mock<IUserBlockRepository> _blocks = new();
        private readonly Mock<ICurrentUserService> _currentUser = new();
        private readonly Mock<ILoggerManager> _logger = new();
        private readonly Mock<IMapper> _mapper = new();
        private readonly Mock<IMessageCipher> _cipher = new();
        private readonly Mock<IChatService> _chatService = new();
        private readonly Mock<IChatNotifier> _notifier = new();
        private readonly Mock<IAttachmentService> _attachments = new();

        private readonly MessageService _service;

        public BlockedConversationTests()
        {
            _repository.SetupGet(r => r.Chat).Returns(_chats.Object);
            _repository.SetupGet(r => r.ChatMember).Returns(_members.Object);
            _repository.SetupGet(r => r.UserBlock).Returns(_blocks.Object);
            _currentUser.SetupGet(u => u.UserId).Returns(CurrentUserId);
            _currentUser.Setup(u => u.GetMembershipAsync(ChatId))
                .ReturnsAsync(new ChatMember { ChatId = ChatId, UserId = CurrentUserId });

            _members.Setup(r => r.GetMembersByChatIdAsync(ChatId, false))
                .ReturnsAsync([
                    new ChatMember { ChatId = ChatId, UserId = CurrentUserId },
                    new ChatMember { ChatId = ChatId, UserId = PartnerId }
                ]);

            _service = new MessageService(_repository.Object, _logger.Object, _mapper.Object,
                _cipher.Object, _currentUser.Object, _chatService.Object, _notifier.Object,
                _attachments.Object);
        }

        private void ChatIs(bool isPrivate) =>
            _chats.Setup(r => r.GetChatAsync(ChatId, false))
                .ReturnsAsync(new Chat { Id = ChatId, IsPrivate = isPrivate });

        private void Blocked(bool blocked) =>
            _blocks.Setup(r => r.IsBlockedEitherWayAsync(CurrentUserId, PartnerId))
                .ReturnsAsync(blocked);

        [Fact]
        public async Task Sending_ToBlockedPartner_Throws()
        {
            ChatIs(isPrivate: true);
            Blocked(true);

            await Assert.ThrowsAsync<BlockedUserException>(() =>
                _service.CreateMessageForChatAsync(ChatId, "hello"));
        }

        [Fact]
        public async Task Sending_WhenNotBlocked_PassesTheCheck()
        {
            ChatIs(isPrivate: true);
            Blocked(false);

            var exception = await Record.ExceptionAsync(() =>
                _service.CreateMessageForChatAsync(ChatId, "hello"));

            Assert.IsNotType<BlockedUserException>(exception);
        }

        [Fact]
        public async Task Sending_ToGroupChat_SkipsTheBlockCheck()
        {
            ChatIs(isPrivate: false);
            Blocked(true);

            var exception = await Record.ExceptionAsync(() =>
                _service.CreateMessageForChatAsync(ChatId, "hello"));

            Assert.IsNotType<BlockedUserException>(exception);
            _blocks.Verify(r => r.IsBlockedEitherWayAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }

        [Fact]
        public async Task Sending_WhenPartnerIsMissing_DoesNotCheckBlocks()
        {
            ChatIs(isPrivate: true);
            _members.Setup(r => r.GetMembersByChatIdAsync(ChatId, false))
                .ReturnsAsync([new ChatMember { ChatId = ChatId, UserId = CurrentUserId }]);

            var exception = await Record.ExceptionAsync(() =>
                _service.CreateMessageForChatAsync(ChatId, "hello"));

            Assert.IsNotType<BlockedUserException>(exception);
            _blocks.Verify(r => r.IsBlockedEitherWayAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }
    }
}
