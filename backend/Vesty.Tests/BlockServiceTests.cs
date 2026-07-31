using Entities.Models;
using Moq;
using Repository.Interfaces;
using Services;
using Services.Interfaces;
using Shared.Exceptions;

namespace Vesty.Tests
{
    public class BlockServiceTests
    {
        private const int CurrentUserId = 1;
        private const int TargetUserId = 2;

        private readonly Mock<IRepositoryManager> _repository = new();
        private readonly Mock<IUserBlockRepository> _blocks = new();
        private readonly Mock<IFriendshipRepository> _friendships = new();
        private readonly Mock<IUserRepository> _users = new();
        private readonly Mock<ICurrentUserService> _currentUser = new();

        private readonly BlockService _service;

        public BlockServiceTests()
        {
            _repository.SetupGet(r => r.UserBlock).Returns(_blocks.Object);
            _repository.SetupGet(r => r.Friendship).Returns(_friendships.Object);
            _repository.SetupGet(r => r.User).Returns(_users.Object);
            _currentUser.SetupGet(u => u.UserId).Returns(CurrentUserId);

            _users.Setup(r => r.GetUserAsync(TargetUserId, false))
                .ReturnsAsync(new User { Id = TargetUserId, UserName = "target" });

            _service = new BlockService(_repository.Object, _currentUser.Object);
        }

        private void ExistingBlock(UserBlock? block) =>
            _blocks.Setup(r => r.GetAsync(CurrentUserId, TargetUserId, It.IsAny<bool>()))
                .ReturnsAsync(block);

        [Fact]
        public async Task BlockAsync_Self_Throws()
        {
            await Assert.ThrowsAsync<SelfBlockException>(() =>
                _service.BlockAsync(CurrentUserId));
        }

        [Fact]
        public async Task BlockAsync_MissingUser_Throws()
        {
            _users.Setup(r => r.GetUserAsync(TargetUserId, false)).ReturnsAsync((User?)null);

            await Assert.ThrowsAsync<UserNotFoundException>(() =>
                _service.BlockAsync(TargetUserId));
        }

        [Fact]
        public async Task BlockAsync_CreatesBlock()
        {
            ExistingBlock(null);

            var (result, created) = await _service.BlockAsync(TargetUserId);

            Assert.True(created);
            _blocks.Verify(r => r.CreateBlock(It.Is<UserBlock>(b =>
                b.BlockerId == CurrentUserId && b.BlockedId == TargetUserId)), Times.Once);
            Assert.Equal(TargetUserId, result.UserId);
        }

        [Fact]
        public async Task BlockAsync_RemovesExistingFriendship()
        {
            ExistingBlock(null);
            var friendship = new Friendship
            {
                RequesterId = CurrentUserId,
                AddresseeId = TargetUserId,
                Status = Friendship.Accepted
            };
            _friendships.Setup(r => r.GetBetweenAsync(CurrentUserId, TargetUserId, true))
                .ReturnsAsync(friendship);

            await _service.BlockAsync(TargetUserId);

            _friendships.Verify(r => r.DeleteFriendship(friendship), Times.Once);
        }

        [Fact]
        public async Task BlockAsync_WhenNoFriendship_DoesNotDelete()
        {
            ExistingBlock(null);
            _friendships.Setup(r => r.GetBetweenAsync(CurrentUserId, TargetUserId, true))
                .ReturnsAsync((Friendship?)null);

            await _service.BlockAsync(TargetUserId);

            _friendships.Verify(r => r.DeleteFriendship(It.IsAny<Friendship>()), Times.Never);
        }

        [Fact]
        public async Task BlockAsync_WhenAlreadyBlocked_KeepsTheOriginalDate()
        {
            var blockedAt = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
            ExistingBlock(new UserBlock
            {
                BlockerId = CurrentUserId,
                BlockedId = TargetUserId,
                CreatedAt = blockedAt
            });

            var (result, created) = await _service.BlockAsync(TargetUserId);

            Assert.False(created);
            Assert.Equal(blockedAt, result.CreatedAt);
        }

        [Fact]
        public async Task BlockAsync_WhenAlreadyBlocked_DoesNotDuplicate()
        {
            ExistingBlock(new UserBlock { BlockerId = CurrentUserId, BlockedId = TargetUserId });

            var (result, created) = await _service.BlockAsync(TargetUserId);

            Assert.False(created);
            _blocks.Verify(r => r.CreateBlock(It.IsAny<UserBlock>()), Times.Never);
            _repository.Verify(r => r.SaveAsync(), Times.Never);
            Assert.Equal(TargetUserId, result.UserId);
        }

        [Fact]
        public async Task UnblockAsync_DeletesTheBlock()
        {
            var block = new UserBlock { BlockerId = CurrentUserId, BlockedId = TargetUserId };
            ExistingBlock(block);

            await _service.UnblockAsync(TargetUserId);

            _blocks.Verify(r => r.DeleteBlock(block), Times.Once);
            _repository.Verify(r => r.SaveAsync(), Times.Once);
        }

        [Fact]
        public async Task UnblockAsync_WhenNotBlocked_Throws()
        {
            ExistingBlock(null);

            await Assert.ThrowsAsync<BlockNotFoundException>(() =>
                _service.UnblockAsync(TargetUserId));
        }

        [Fact]
        public async Task GetBlockedAsync_ReturnsTheBlockedSide()
        {
            _blocks.Setup(r => r.GetByBlockerAsync(CurrentUserId))
                .ReturnsAsync([
                    new UserBlock
                    {
                        BlockerId = CurrentUserId,
                        BlockedId = TargetUserId,
                        Blocked = new User { Id = TargetUserId, UserName = "blocked" }
                    }
                ]);

            var blocked = (await _service.GetBlockedAsync()).ToList();

            Assert.Single(blocked);
            Assert.Equal(TargetUserId, blocked[0].UserId);
            Assert.Equal("blocked", blocked[0].UserName);
        }
    }
}
