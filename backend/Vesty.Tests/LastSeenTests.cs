using Entities.Models;
using Moq;
using Repository.Interfaces;
using Services;
using Services.Interfaces;

namespace Vesty.Tests
{
    public class LastSeenTests
    {
        private const int UserId = 1;

        private readonly Mock<IRepositoryManager> _repository = new();
        private readonly Mock<IUserRepository> _users = new();
        private readonly Mock<ICurrentUserService> _currentUser = new();
        private readonly Mock<IPresenceTracker> _presence = new();
        private readonly Mock<IChatNotifier> _notifier = new();

        private readonly PresenceService _presenceService;

        public LastSeenTests()
        {
            _repository.SetupGet(r => r.User).Returns(_users.Object);
            _presenceService = new PresenceService(_repository.Object, _currentUser.Object,
                _presence.Object, _notifier.Object);
        }

        [Fact]
        public async Task RecordLastSeenAsync_StampsTheUser()
        {
            var user = new User { Id = UserId, UserName = "me" };
            _users.Setup(r => r.GetUserAsync(UserId, true)).ReturnsAsync(user);
            var before = DateTime.UtcNow;

            await _presenceService.RecordLastSeenAsync(UserId);

            Assert.NotNull(user.LastSeenAt);
            Assert.InRange(user.LastSeenAt!.Value, before, DateTime.UtcNow);
            _repository.Verify(r => r.SaveAsync(), Times.Once);
        }

        [Fact]
        public async Task RecordLastSeenAsync_MovesTheStampForward()
        {
            var user = new User
            {
                Id = UserId,
                UserName = "me",
                LastSeenAt = DateTime.UtcNow.AddDays(-1)
            };
            _users.Setup(r => r.GetUserAsync(UserId, true)).ReturnsAsync(user);
            var earlier = user.LastSeenAt!.Value;

            await _presenceService.RecordLastSeenAsync(UserId);

            Assert.True(user.LastSeenAt > earlier);
        }

        [Fact]
        public async Task RecordLastSeenAsync_SavesNothingForAnUnknownUser()
        {
            _users.Setup(r => r.GetUserAsync(UserId, true)).ReturnsAsync((User?)null);

            await _presenceService.RecordLastSeenAsync(UserId);

            _repository.Verify(r => r.SaveAsync(), Times.Never);
        }
    }
}
