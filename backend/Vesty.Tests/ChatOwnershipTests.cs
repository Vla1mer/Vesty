using AutoMapper;
using Entities.Models;
using Moq;
using Repository.Interfaces;
using Services;
using Services.Interfaces;
using Shared.Exceptions;

namespace Vesty.Tests
{
    public class ChatOwnershipTests
    {
        private const int OwnerId = 1;
        private const int MemberId = 2;
        private const int ChatId = 10;

        private readonly Mock<IRepositoryManager> _repository = new();
        private readonly Mock<IChatRepository> _chats = new();
        private readonly Mock<IChatMemberRepository> _members = new();
        private readonly Mock<ICurrentUserService> _currentUser = new();
        private readonly Mock<ILoggerManager> _logger = new();
        private readonly Mock<IMapper> _mapper = new();
        private readonly Mock<IChatNotifier> _notifier = new();

        private readonly ChatMemberService _service;

        public ChatOwnershipTests()
        {
            _repository.SetupGet(r => r.Chat).Returns(_chats.Object);
            _repository.SetupGet(r => r.ChatMember).Returns(_members.Object);
            _currentUser.SetupGet(u => u.UserId).Returns(OwnerId);

            _chats.Setup(r => r.GetChatAsync(ChatId, It.IsAny<bool>()))
                .ReturnsAsync(new Chat { Id = ChatId, IsPrivate = false });

            _service = new ChatMemberService(_repository.Object, _logger.Object, _mapper.Object,
                _currentUser.Object, _notifier.Object);
        }

        private (ChatMember owner, ChatMember member) Membership()
        {
            var owner = new ChatMember { ChatId = ChatId, UserId = OwnerId, RoleId = UserRole.Owner };
            var member = new ChatMember { ChatId = ChatId, UserId = MemberId, RoleId = UserRole.User };
            _members.Setup(r => r.GetMemberAsync(ChatId, OwnerId, true)).ReturnsAsync(owner);
            _members.Setup(r => r.GetMemberAsync(ChatId, MemberId, true)).ReturnsAsync(member);
            _currentUser.Setup(u => u.GetMembershipAsync(ChatId)).ReturnsAsync(owner);
            return (owner, member);
        }

        [Fact]
        public async Task TransferOwnershipAsync_PromotesTargetAndDemotesCaller()
        {
            var (owner, member) = Membership();

            await _service.TransferOwnershipAsync(ChatId, MemberId);

            Assert.Equal(UserRole.Owner, member.RoleId);
            Assert.Equal(UserRole.Admin, owner.RoleId);
            _repository.Verify(r => r.SaveAsync(), Times.Once);
        }

        [Fact]
        public async Task TransferOwnershipAsync_WhenCallerIsNotOwner_Throws()
        {
            var caller = new ChatMember { ChatId = ChatId, UserId = OwnerId, RoleId = UserRole.Admin };
            _members.Setup(r => r.GetMemberAsync(ChatId, OwnerId, true)).ReturnsAsync(caller);

            await Assert.ThrowsAsync<InsufficientChatPermissionException>(() =>
                _service.TransferOwnershipAsync(ChatId, MemberId));

            _repository.Verify(r => r.SaveAsync(), Times.Never);
        }

        [Fact]
        public async Task TransferOwnershipAsync_ToSelf_Throws()
        {
            Membership();

            await Assert.ThrowsAsync<InvalidRoleAssignmentException>(() =>
                _service.TransferOwnershipAsync(ChatId, OwnerId));
        }

        [Fact]
        public async Task TransferOwnershipAsync_ToNonMember_Throws()
        {
            Membership();
            _members.Setup(r => r.GetMemberAsync(ChatId, 99, true)).ReturnsAsync((ChatMember?)null);

            await Assert.ThrowsAsync<ChatMemberNotFoundException>(() =>
                _service.TransferOwnershipAsync(ChatId, 99));
        }

        [Fact]
        public async Task TransferOwnershipAsync_InPrivateChat_Throws()
        {
            _chats.Setup(r => r.GetChatAsync(ChatId, It.IsAny<bool>()))
                .ReturnsAsync(new Chat { Id = ChatId, IsPrivate = true });

            await Assert.ThrowsAsync<OperationNotAllowedInPrivateChatException>(() =>
                _service.TransferOwnershipAsync(ChatId, MemberId));
        }

        [Fact]
        public async Task RemoveUserFromChatAsync_OwnerLeaving_Throws()
        {
            var owner = new ChatMember { ChatId = ChatId, UserId = OwnerId, RoleId = UserRole.Owner };
            _currentUser.Setup(u => u.GetMembershipAsync(ChatId)).ReturnsAsync(owner);

            await Assert.ThrowsAsync<InvalidRoleAssignmentException>(() =>
                _service.RemoveUserFromChatAsync(ChatId, OwnerId));

            _members.Verify(r => r.DeleteMember(It.IsAny<ChatMember>()), Times.Never);
        }

        [Fact]
        public async Task RemoveUserFromChatAsync_MemberLeaving_Removes()
        {
            var member = new ChatMember { ChatId = ChatId, UserId = MemberId, RoleId = UserRole.User };
            _currentUser.SetupGet(u => u.UserId).Returns(MemberId);
            _currentUser.Setup(u => u.GetMembershipAsync(ChatId)).ReturnsAsync(member);

            await _service.RemoveUserFromChatAsync(ChatId, MemberId);

            _members.Verify(r => r.DeleteMember(member), Times.Once);
        }
    }
}
