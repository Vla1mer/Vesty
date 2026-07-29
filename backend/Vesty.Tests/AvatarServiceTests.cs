using Entities.Models;
using Moq;
using Repository.Interfaces;
using Services;
using Services.Interfaces;
using Shared.Exceptions;

namespace Vesty.Tests
{
    public class AvatarServiceTests
    {
        private const int CurrentUserId = 1;

        private readonly Mock<IRepositoryManager> _repository = new();
        private readonly Mock<IUserRepository> _users = new();
        private readonly Mock<IAvatarRepository> _avatars = new();
        private readonly Mock<ICurrentUserService> _currentUser = new();

        private readonly AvatarService _service;

        public AvatarServiceTests()
        {
            _repository.SetupGet(r => r.User).Returns(_users.Object);
            _repository.SetupGet(r => r.Avatar).Returns(_avatars.Object);
            _currentUser.SetupGet(u => u.UserId).Returns(CurrentUserId);

            _users.Setup(r => r.GetUserAsync(It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync((int id, bool _) => new User { Id = id });

            _service = new AvatarService(_repository.Object, _currentUser.Object);
        }

        private static Stream ImageOf(int size) => new MemoryStream(new byte[size]);

        [Fact]
        public async Task SetAsync_ForAnotherUser_Throws()
        {
            const int otherUserId = 2;

            await Assert.ThrowsAsync<UserSelfModificationException>(() =>
                _service.SetAsync(otherUserId, ImageOf(10), "image/png", 10));
        }

        [Theory]
        [InlineData("text/plain")]
        [InlineData("image/gif")]
        [InlineData(null)]
        public async Task SetAsync_WithUnsupportedContentType_Throws(string? contentType)
        {
            await Assert.ThrowsAsync<InvalidAvatarException>(() =>
                _service.SetAsync(CurrentUserId, ImageOf(10), contentType, 10));
        }

        [Fact]
        public async Task SetAsync_WhenFileTooLarge_Throws()
        {
            const int tooLarge = 300 * 1024 + 1;

            await Assert.ThrowsAsync<InvalidAvatarException>(() =>
                _service.SetAsync(CurrentUserId, ImageOf(1), "image/png", tooLarge));
        }

        [Fact]
        public async Task SetAsync_WhenFileEmpty_Throws()
        {
            await Assert.ThrowsAsync<InvalidAvatarException>(() =>
                _service.SetAsync(CurrentUserId, ImageOf(0), "image/png", 0));
        }

        [Fact]
        public async Task SetAsync_WithoutExistingAvatar_CreatesOne()
        {
            _avatars.Setup(r => r.GetAvatarAsync(CurrentUserId, It.IsAny<bool>()))
                .ReturnsAsync((UserAvatar?)null);

            await _service.SetAsync(CurrentUserId, ImageOf(64), "image/png", 64);

            _avatars.Verify(r => r.CreateAvatar(It.Is<UserAvatar>(a =>
                a.UserId == CurrentUserId &&
                a.ContentType == "image/png" &&
                a.Data.Length == 64)), Times.Once);
            _repository.Verify(r => r.SaveAsync(), Times.Once);
        }

        [Fact]
        public async Task SetAsync_WithExistingAvatar_ReplacesData()
        {
            var existing = new UserAvatar
            {
                UserId = CurrentUserId,
                ContentType = "image/jpeg",
                Data = new byte[8]
            };
            _avatars.Setup(r => r.GetAvatarAsync(CurrentUserId, It.IsAny<bool>()))
                .ReturnsAsync(existing);

            await _service.SetAsync(CurrentUserId, ImageOf(32), "image/webp", 32);

            Assert.Equal("image/webp", existing.ContentType);
            Assert.Equal(32, existing.Data.Length);
            _avatars.Verify(r => r.CreateAvatar(It.IsAny<UserAvatar>()), Times.Never);
            _repository.Verify(r => r.SaveAsync(), Times.Once);
        }

        [Fact]
        public async Task SetAsync_MarksAvatarUpdatedAt()
        {
            var user = new User { Id = CurrentUserId };
            _users.Setup(r => r.GetUserAsync(CurrentUserId, true)).ReturnsAsync(user);
            _avatars.Setup(r => r.GetAvatarAsync(CurrentUserId, It.IsAny<bool>()))
                .ReturnsAsync((UserAvatar?)null);

            await _service.SetAsync(CurrentUserId, ImageOf(16), "image/png", 16);

            Assert.NotNull(user.AvatarUpdatedAt);
        }

        [Fact]
        public async Task DeleteAsync_ForAnotherUser_Throws()
        {
            await Assert.ThrowsAsync<UserSelfModificationException>(() =>
                _service.DeleteAsync(2));
        }

        [Fact]
        public async Task DeleteAsync_ClearsAvatarAndFlag()
        {
            var user = new User { Id = CurrentUserId, AvatarUpdatedAt = DateTime.UtcNow };
            var avatar = new UserAvatar { UserId = CurrentUserId };
            _users.Setup(r => r.GetUserAsync(CurrentUserId, true)).ReturnsAsync(user);
            _avatars.Setup(r => r.GetAvatarAsync(CurrentUserId, It.IsAny<bool>()))
                .ReturnsAsync(avatar);

            await _service.DeleteAsync(CurrentUserId);

            _avatars.Verify(r => r.DeleteAvatar(avatar), Times.Once);
            Assert.Null(user.AvatarUpdatedAt);
            _repository.Verify(r => r.SaveAsync(), Times.Once);
        }

        [Fact]
        public async Task GetAsync_WhenUserHasNoAvatar_ReturnsNull()
        {
            _users.Setup(r => r.GetUserAsync(CurrentUserId, false))
                .ReturnsAsync(new User { Id = CurrentUserId, AvatarUpdatedAt = null });

            var result = await _service.GetAsync(CurrentUserId);

            Assert.Null(result);
        }

        [Fact]
        public async Task GetAsync_WhenUserHasAvatar_ReturnsIt()
        {
            var updatedAt = new DateTime(2026, 7, 28, 12, 0, 0, DateTimeKind.Utc);
            _users.Setup(r => r.GetUserAsync(CurrentUserId, false))
                .ReturnsAsync(new User { Id = CurrentUserId, AvatarUpdatedAt = updatedAt });
            _avatars.Setup(r => r.GetAvatarAsync(CurrentUserId, false))
                .ReturnsAsync(new UserAvatar
                {
                    UserId = CurrentUserId,
                    ContentType = "image/webp",
                    Data = new byte[] { 1, 2, 3 }
                });

            var result = await _service.GetAsync(CurrentUserId);

            Assert.NotNull(result);
            Assert.Equal("image/webp", result.ContentType);
            Assert.Equal(updatedAt, result.UpdatedAt);
            Assert.Equal(3, result.Data.Length);
        }

        [Fact]
        public async Task GetAsync_WhenFlagSetButRowMissing_ReturnsNull()
        {
            _users.Setup(r => r.GetUserAsync(CurrentUserId, false))
                .ReturnsAsync(new User { Id = CurrentUserId, AvatarUpdatedAt = DateTime.UtcNow });
            _avatars.Setup(r => r.GetAvatarAsync(CurrentUserId, false))
                .ReturnsAsync((UserAvatar?)null);

            Assert.Null(await _service.GetAsync(CurrentUserId));
        }

        [Fact]
        public async Task GetAsync_ForMissingUser_Throws()
        {
            _users.Setup(r => r.GetUserAsync(99, It.IsAny<bool>())).ReturnsAsync((User?)null);

            await Assert.ThrowsAsync<UserNotFoundException>(() => _service.GetAsync(99));
        }
    }
}
