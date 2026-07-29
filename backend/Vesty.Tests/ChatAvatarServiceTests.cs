using Entities.Models;
using Moq;
using Repository.Interfaces;
using Services;
using Services.Interfaces;
using Shared.Exceptions;

namespace Vesty.Tests
{
    public class ChatAvatarServiceTests
    {
        private const int CurrentUserId = 1;
        private const int GroupChatId = 10;

        private readonly Mock<IRepositoryManager> _repository = new();
        private readonly Mock<IChatRepository> _chats = new();
        private readonly Mock<IChatAvatarRepository> _avatars = new();
        private readonly Mock<ICurrentUserService> _currentUser = new();

        private readonly ChatAvatarService _service;

        public ChatAvatarServiceTests()
        {
            _repository.SetupGet(r => r.Chat).Returns(_chats.Object);
            _repository.SetupGet(r => r.ChatAvatar).Returns(_avatars.Object);
            _currentUser.SetupGet(u => u.UserId).Returns(CurrentUserId);

            _service = new ChatAvatarService(_repository.Object, _currentUser.Object);
        }

        private void ChatIs(bool isPrivate) =>
            _chats.Setup(r => r.GetChatAsync(GroupChatId, It.IsAny<bool>()))
                .ReturnsAsync(new Chat { Id = GroupChatId, IsPrivate = isPrivate });

        private void CallerRole(int? roleId) =>
            _currentUser.Setup(u => u.GetMembershipAsync(GroupChatId))
                .ReturnsAsync(roleId is null
                    ? null
                    : new ChatMember { ChatId = GroupChatId, UserId = CurrentUserId, RoleId = roleId.Value });

        private static Stream ImageOf(int size) => new MemoryStream(new byte[size]);

        [Theory]
        [InlineData(UserRole.Owner)]
        [InlineData(UserRole.Admin)]
        public async Task SetAsync_AsOwnerOrAdmin_Succeeds(int roleId)
        {
            ChatIs(isPrivate: false);
            CallerRole(roleId);
            _avatars.Setup(r => r.GetAvatarAsync(GroupChatId, It.IsAny<bool>()))
                .ReturnsAsync((ChatAvatar?)null);

            await _service.SetAsync(GroupChatId, ImageOf(32), "image/png", 32);

            _avatars.Verify(r => r.CreateAvatar(It.IsAny<ChatAvatar>()), Times.Once);
        }

        [Fact]
        public async Task SetAsync_AsRegularMember_Throws()
        {
            ChatIs(isPrivate: false);
            CallerRole(UserRole.User);

            await Assert.ThrowsAsync<InsufficientChatPermissionException>(() =>
                _service.SetAsync(GroupChatId, ImageOf(32), "image/png", 32));
        }

        [Fact]
        public async Task SetAsync_AsNonMember_Throws()
        {
            ChatIs(isPrivate: false);
            CallerRole(null);

            await Assert.ThrowsAsync<InsufficientChatPermissionException>(() =>
                _service.SetAsync(GroupChatId, ImageOf(32), "image/png", 32));
        }

        [Fact]
        public async Task SetAsync_InPrivateChat_Throws()
        {
            ChatIs(isPrivate: true);
            CallerRole(UserRole.Owner);

            await Assert.ThrowsAsync<OperationNotAllowedInPrivateChatException>(() =>
                _service.SetAsync(GroupChatId, ImageOf(32), "image/png", 32));
        }

        [Fact]
        public async Task SetAsync_ForMissingChat_Throws()
        {
            _chats.Setup(r => r.GetChatAsync(GroupChatId, It.IsAny<bool>()))
                .ReturnsAsync((Chat?)null);

            await Assert.ThrowsAsync<ChatNotFoundException>(() =>
                _service.SetAsync(GroupChatId, ImageOf(32), "image/png", 32));
        }

        [Fact]
        public async Task DeleteAsync_AsRegularMember_Throws()
        {
            ChatIs(isPrivate: false);
            CallerRole(UserRole.User);

            await Assert.ThrowsAsync<InsufficientChatPermissionException>(() =>
                _service.DeleteAsync(GroupChatId));
        }

        [Fact]
        public async Task DeleteAsync_AsOwner_ClearsAvatarAndFlag()
        {
            var chat = new Chat { Id = GroupChatId, IsPrivate = false, AvatarUpdatedAt = DateTime.UtcNow };
            _chats.Setup(r => r.GetChatAsync(GroupChatId, It.IsAny<bool>())).ReturnsAsync(chat);
            CallerRole(UserRole.Owner);

            var avatar = new ChatAvatar { ChatId = GroupChatId };
            _avatars.Setup(r => r.GetAvatarAsync(GroupChatId, It.IsAny<bool>())).ReturnsAsync(avatar);

            await _service.DeleteAsync(GroupChatId);

            _avatars.Verify(r => r.DeleteAvatar(avatar), Times.Once);
            Assert.Null(chat.AvatarUpdatedAt);
        }
    }
}
