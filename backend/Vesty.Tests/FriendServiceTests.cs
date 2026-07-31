using Entities.Models;
using Moq;
using Repository.Interfaces;
using Services;
using Services.DataTransferObjects;
using Services.Interfaces;
using Shared.Exceptions;

namespace Vesty.Tests
{
    public class FriendServiceTests
    {
        private const int CurrentUserId = 1;
        private const int OtherUserId = 2;

        private readonly Mock<IRepositoryManager> _repository = new();
        private readonly Mock<IFriendshipRepository> _friendships = new();
        private readonly Mock<IUserRepository> _users = new();
        private readonly Mock<IUserBlockRepository> _blocks = new();
        private readonly Mock<ICurrentUserService> _currentUser = new();
        private readonly Mock<IChatNotifier> _notifier = new();

        private readonly FriendService _service;

        public FriendServiceTests()
        {
            _repository.SetupGet(r => r.Friendship).Returns(_friendships.Object);
            _repository.SetupGet(r => r.User).Returns(_users.Object);
            _repository.SetupGet(r => r.UserBlock).Returns(_blocks.Object);
            _blocks.Setup(r => r.IsBlockedEitherWayAsync(It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(false);
            _currentUser.SetupGet(u => u.UserId).Returns(CurrentUserId);

            _users.Setup(r => r.GetUserAsync(It.IsAny<int>(), false))
                .ReturnsAsync((int id, bool _) => new User { Id = id, UserName = $"user{id}" });

            _service = new FriendService(_repository.Object, _currentUser.Object, _notifier.Object);
        }

        private void ExistingFriendship(Friendship? friendship) =>
            _friendships.Setup(r => r.GetBetweenAsync(CurrentUserId, OtherUserId, true))
                .ReturnsAsync(friendship);

        private static Friendship Pending(int requesterId, int addresseeId) =>
            new() { Id = 7, RequesterId = requesterId, AddresseeId = addresseeId, Status = Friendship.Pending };

        [Fact]
        public async Task SendRequestAsync_ToSelf_Throws()
        {
            await Assert.ThrowsAsync<FriendshipWithSelfException>(() =>
                _service.SendRequestAsync(CurrentUserId));
        }

        [Fact]
        public async Task SendRequestAsync_ToMissingUser_Throws()
        {
            _users.Setup(r => r.GetUserAsync(OtherUserId, false)).ReturnsAsync((User?)null);

            await Assert.ThrowsAsync<UserNotFoundException>(() =>
                _service.SendRequestAsync(OtherUserId));
        }

        [Fact]
        public async Task SendRequestAsync_WhenNoRelation_CreatesPending()
        {
            ExistingFriendship(null);

            var result = await _service.SendRequestAsync(OtherUserId);

            _friendships.Verify(r => r.CreateFriendship(It.Is<Friendship>(f =>
                f.RequesterId == CurrentUserId &&
                f.AddresseeId == OtherUserId &&
                f.Status == Friendship.Pending)), Times.Once);
            Assert.Equal(Friendship.Pending, result.Status);
            Assert.Equal(OtherUserId, result.UserId);
        }

        [Fact]
        public async Task SendRequestAsync_NotifiesTheAddressee()
        {
            ExistingFriendship(null);

            await _service.SendRequestAsync(OtherUserId);

            _notifier.Verify(n => n.FriendRequestReceivedAsync(
                It.Is<IEnumerable<int>>(ids => ids.Single() == OtherUserId),
                It.IsAny<FriendDto>()), Times.Once);
        }

        [Fact]
        public async Task SendRequestAsync_WhenAlreadyFriends_Throws()
        {
            ExistingFriendship(new Friendship
            {
                RequesterId = CurrentUserId,
                AddresseeId = OtherUserId,
                Status = Friendship.Accepted
            });

            await Assert.ThrowsAsync<FriendshipAlreadyExistsException>(() =>
                _service.SendRequestAsync(OtherUserId));
        }

        [Fact]
        public async Task SendRequestAsync_WhenOwnRequestPending_Throws()
        {
            ExistingFriendship(Pending(CurrentUserId, OtherUserId));

            await Assert.ThrowsAsync<FriendshipAlreadyExistsException>(() =>
                _service.SendRequestAsync(OtherUserId));
        }

        [Fact]
        public async Task SendRequestAsync_WhenTheyAlreadyInvitedUs_AcceptsInstead()
        {
            var incoming = Pending(OtherUserId, CurrentUserId);
            ExistingFriendship(incoming);

            var result = await _service.SendRequestAsync(OtherUserId);

            Assert.Equal(Friendship.Accepted, incoming.Status);
            Assert.NotNull(incoming.RespondedAt);
            Assert.Equal(Friendship.Accepted, result.Status);
            _friendships.Verify(r => r.CreateFriendship(It.IsAny<Friendship>()), Times.Never);
        }

        private void Blocked() =>
            _blocks.Setup(r => r.IsBlockedEitherWayAsync(CurrentUserId, OtherUserId))
                .ReturnsAsync(true);

        [Fact]
        public async Task SendRequestAsync_WhenBlocked_Throws()
        {
            Blocked();

            await Assert.ThrowsAsync<BlockedUserException>(() =>
                _service.SendRequestAsync(OtherUserId));
        }

        [Fact]
        public async Task SendRequestAsync_WhenBlocked_DoesNotCreateAnything()
        {
            Blocked();

            await Assert.ThrowsAsync<BlockedUserException>(() =>
                _service.SendRequestAsync(OtherUserId));

            _friendships.Verify(r => r.CreateFriendship(It.IsAny<Friendship>()), Times.Never);
        }

        [Fact]
        public async Task AcceptAsync_WhenBlocked_Throws()
        {
            Blocked();

            await Assert.ThrowsAsync<BlockedUserException>(() =>
                _service.AcceptAsync(OtherUserId));

            // запрет срабатывает до обращения к связи, а не после
            _friendships.Verify(
                r => r.GetBetweenAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()),
                Times.Never);
        }

        [Fact]
        public async Task AcceptAsync_MarksAcceptedAndNotifies()
        {
            var incoming = Pending(OtherUserId, CurrentUserId);
            ExistingFriendship(incoming);

            var result = await _service.AcceptAsync(OtherUserId);

            Assert.Equal(Friendship.Accepted, incoming.Status);
            Assert.Equal(Friendship.Accepted, result.Status);
            _notifier.Verify(n => n.FriendshipAcceptedAsync(
                It.Is<IEnumerable<int>>(ids => ids.Single() == OtherUserId),
                It.IsAny<FriendDto>()), Times.Once);
        }

        [Fact]
        public async Task AcceptAsync_WhenNothingPending_Throws()
        {
            ExistingFriendship(null);

            await Assert.ThrowsAsync<FriendshipNotFoundException>(() =>
                _service.AcceptAsync(OtherUserId));
        }

        [Fact]
        public async Task AcceptAsync_WhenAlreadyAccepted_Throws()
        {
            ExistingFriendship(new Friendship
            {
                RequesterId = OtherUserId,
                AddresseeId = CurrentUserId,
                Status = Friendship.Accepted
            });

            await Assert.ThrowsAsync<FriendshipNotFoundException>(() =>
                _service.AcceptAsync(OtherUserId));
        }

        [Fact]
        public async Task AcceptAsync_OwnOutgoingRequest_Throws()
        {
            ExistingFriendship(Pending(CurrentUserId, OtherUserId));

            await Assert.ThrowsAsync<FriendshipNotFoundException>(() =>
                _service.AcceptAsync(OtherUserId));
        }

        [Fact]
        public async Task RemoveAsync_DeletesAndNotifies()
        {
            var friendship = new Friendship
            {
                RequesterId = CurrentUserId,
                AddresseeId = OtherUserId,
                Status = Friendship.Accepted
            };
            ExistingFriendship(friendship);

            await _service.RemoveAsync(OtherUserId);

            _friendships.Verify(r => r.DeleteFriendship(friendship), Times.Once);
            _notifier.Verify(n => n.FriendshipRemovedAsync(
                It.Is<IEnumerable<int>>(ids => ids.Single() == OtherUserId),
                CurrentUserId), Times.Once);
        }

        [Fact]
        public async Task RemoveAsync_WhenNoRelation_Throws()
        {
            ExistingFriendship(null);

            await Assert.ThrowsAsync<FriendshipNotFoundException>(() =>
                _service.RemoveAsync(OtherUserId));
        }

        [Fact]
        public async Task GetPendingAsync_MarksIncomingDirection()
        {
            _friendships.Setup(r => r.GetByStatusAsync(CurrentUserId, Friendship.Pending, false))
                .ReturnsAsync([
                    new Friendship
                    {
                        RequesterId = OtherUserId,
                        AddresseeId = CurrentUserId,
                        Status = Friendship.Pending,
                        Requester = new User { Id = OtherUserId, UserName = "them" },
                        Addressee = new User { Id = CurrentUserId, UserName = "me" }
                    },
                    new Friendship
                    {
                        RequesterId = CurrentUserId,
                        AddresseeId = 3,
                        Status = Friendship.Pending,
                        Requester = new User { Id = CurrentUserId, UserName = "me" },
                        Addressee = new User { Id = 3, UserName = "third" }
                    }
                ]);

            var pending = (await _service.GetPendingAsync()).ToList();

            Assert.True(pending[0].IsIncoming);
            Assert.Equal("them", pending[0].UserName);
            Assert.False(pending[1].IsIncoming);
            Assert.Equal("third", pending[1].UserName);
        }

        [Fact]
        public async Task GetFriendsAsync_ReturnsTheOtherSide()
        {
            _friendships.Setup(r => r.GetByStatusAsync(CurrentUserId, Friendship.Accepted, false))
                .ReturnsAsync([
                    new Friendship
                    {
                        RequesterId = CurrentUserId,
                        AddresseeId = OtherUserId,
                        Status = Friendship.Accepted,
                        Requester = new User { Id = CurrentUserId, UserName = "me" },
                        Addressee = new User { Id = OtherUserId, UserName = "friend" }
                    }
                ]);

            var friends = (await _service.GetFriendsAsync()).ToList();

            Assert.Single(friends);
            Assert.Equal(OtherUserId, friends[0].UserId);
            Assert.Equal("friend", friends[0].UserName);
        }
    }
}
