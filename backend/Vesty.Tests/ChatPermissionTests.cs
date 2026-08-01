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
    public class ChatPermissionTests
    {
        private const int CallerId = 1;
        private const int ChatId = 10;

        private readonly Mock<IRepositoryManager> _repository = new();
        private readonly Mock<IChatRepository> _chats = new();
        private readonly Mock<IChatMemberRepository> _members = new();
        private readonly Mock<IMessageRepository> _messages = new();
        private readonly Mock<IUserRepository> _users = new();
        private readonly Mock<IUserBlockRepository> _blocks = new();
        private readonly Mock<IFriendshipRepository> _friendships = new();
        private readonly Mock<ICurrentUserService> _currentUser = new();
        private readonly Mock<ILoggerManager> _logger = new();
        private readonly Mock<IMapper> _mapper = new();
        private readonly Mock<IMessageCipher> _cipher = new();
        private readonly Mock<IChatNotifier> _notifier = new();
        private readonly Mock<IChatService> _chatService = new();
        private readonly Mock<IAttachmentService> _attachmentService = new();

        public ChatPermissionTests()
        {
            _repository.SetupGet(r => r.Chat).Returns(_chats.Object);
            _repository.SetupGet(r => r.ChatMember).Returns(_members.Object);
            _repository.SetupGet(r => r.Message).Returns(_messages.Object);
            _repository.SetupGet(r => r.User).Returns(_users.Object);
            _repository.SetupGet(r => r.UserBlock).Returns(_blocks.Object);
            _repository.SetupGet(r => r.Friendship).Returns(_friendships.Object);
            _currentUser.SetupGet(u => u.UserId).Returns(CallerId);
            _cipher.Setup(c => c.Encrypt(It.IsAny<string>())).Returns((string v) => v);
            _blocks.Setup(r => r.IsBlockedEitherWayAsync(It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(false);
            _attachmentService.Setup(s => s.ReserveAsync(It.IsAny<IEnumerable<int>>()))
                .ReturnsAsync([]);
            _members.Setup(r => r.GetMembersByChatIdAsync(ChatId, false)).ReturnsAsync([]);
        }

        [Theory]
        [InlineData(ChatPermission.Owner, UserRole.Owner, true)]
        [InlineData(ChatPermission.Owner, UserRole.Admin, false)]
        [InlineData(ChatPermission.Owner, UserRole.User, false)]
        [InlineData(ChatPermission.Admins, UserRole.Owner, true)]
        [InlineData(ChatPermission.Admins, UserRole.Admin, true)]
        [InlineData(ChatPermission.Admins, UserRole.User, false)]
        [InlineData(ChatPermission.Members, UserRole.Owner, true)]
        [InlineData(ChatPermission.Members, UserRole.Admin, true)]
        [InlineData(ChatPermission.Members, UserRole.User, true)]
        public void Allows_FollowsTheRoleHierarchy(int permission, int roleId, bool expected) =>
            Assert.Equal(expected, ChatPermission.Allows(permission, roleId));

        private MessageService MessageServiceWith(int whoCanPost, int callerRoleId)
        {
            _chats.Setup(r => r.GetChatAsync(ChatId, It.IsAny<bool>()))
                .ReturnsAsync(new Chat { Id = ChatId, IsPrivate = false, WhoCanPost = whoCanPost });
            _currentUser.Setup(u => u.GetMembershipAsync(ChatId))
                .ReturnsAsync(new ChatMember { ChatId = ChatId, UserId = CallerId, RoleId = callerRoleId });

            return new MessageService(_repository.Object, _logger.Object, _mapper.Object,
                _cipher.Object, _currentUser.Object, _chatService.Object, _notifier.Object,
                _attachmentService.Object);
        }

        [Fact]
        public async Task PostingInAnAdminsOnlyChat_AsMember_Throws()
        {
            var service = MessageServiceWith(ChatPermission.Admins, UserRole.User);

            await Assert.ThrowsAsync<InsufficientChatPermissionException>(() =>
                service.CreateMessageForChatAsync(ChatId, "hello"));

            _messages.Verify(r => r.CreateMessageForChat(It.IsAny<int>(), It.IsAny<Message>()), Times.Never);
        }

        [Fact]
        public async Task PostingInAnAdminsOnlyChat_AsAdmin_IsAllowed()
        {
            var service = MessageServiceWith(ChatPermission.Admins, UserRole.Admin);
            _mapper.Setup(m => m.Map<MessageDto>(It.IsAny<Message>())).Returns(new MessageDto());

            await service.CreateMessageForChatAsync(ChatId, "hello");

            _messages.Verify(r => r.CreateMessageForChat(ChatId, It.IsAny<Message>()), Times.Once);
        }

        private ChatMemberService MemberServiceWith(int whoCanInvite, int callerRoleId)
        {
            _chats.Setup(r => r.GetChatAsync(ChatId, It.IsAny<bool>()))
                .ReturnsAsync(new Chat { Id = ChatId, IsPrivate = false, WhoCanInvite = whoCanInvite });
            _currentUser.Setup(u => u.GetMembershipAsync(ChatId))
                .ReturnsAsync(new ChatMember { ChatId = ChatId, UserId = CallerId, RoleId = callerRoleId });
            _users.Setup(r => r.GetUserAsync(7, false))
                .ReturnsAsync(new User { Id = 7, UserName = "invitee", WhoCanInvite = PrivacyLevel.Everyone });
            _members.Setup(r => r.IsUserInChatAsync(ChatId, 7)).ReturnsAsync(false);

            return new ChatMemberService(_repository.Object, _logger.Object, _mapper.Object,
                _currentUser.Object, _notifier.Object);
        }

        [Fact]
        public async Task InvitingToAnOpenChat_AsPlainMember_IsAllowed()
        {
            var service = MemberServiceWith(ChatPermission.Members, UserRole.User);

            await service.AddUserToChatAsync(ChatId, new ChatMemberForCreationDto { UserId = 7 });

            _members.Verify(r => r.CreateMember(It.Is<ChatMember>(m => m.UserId == 7)), Times.Once);
        }

        [Fact]
        public async Task InvitingToAnAdminsOnlyChat_AsPlainMember_Throws()
        {
            var service = MemberServiceWith(ChatPermission.Admins, UserRole.User);

            await Assert.ThrowsAsync<InsufficientChatPermissionException>(() =>
                service.AddUserToChatAsync(ChatId, new ChatMemberForCreationDto { UserId = 7 }));

            _members.Verify(r => r.CreateMember(It.IsAny<ChatMember>()), Times.Never);
        }
    }
}
