using Entities.Models;
using Repository.Interfaces;
using Services.DataTransferObjects;
using Services.Interfaces;
using Shared.Exceptions;

namespace Services
{
    public class FriendService : IFriendService
    {
        private readonly IRepositoryManager _repository;
        private readonly ICurrentUserService _currentUser;
        private readonly IChatNotifier _notifier;

        public FriendService(IRepositoryManager repository, ICurrentUserService currentUser,
            IChatNotifier notifier)
        {
            _repository = repository;
            _currentUser = currentUser;
            _notifier = notifier;
        }

        public async Task<IEnumerable<FriendDto>> GetFriendsAsync()
        {
            var friendships = await _repository.Friendship.GetByStatusAsync(
                _currentUser.UserId, Friendship.Accepted, trackChanges: false);

            return friendships.Select(ToDto);
        }

        public async Task<IEnumerable<FriendDto>> GetPendingAsync()
        {
            var friendships = await _repository.Friendship.GetByStatusAsync(
                _currentUser.UserId, Friendship.Pending, trackChanges: false);

            return friendships.Select(ToDto);
        }

        public async Task<FriendDto> SendRequestAsync(int targetUserId)
        {
            var currentUserId = _currentUser.UserId;
            if (targetUserId == currentUserId)
                throw new FriendshipWithSelfException();

            await EnsureUserExistsAsync(targetUserId);
            await EnsureNotBlockedAsync(targetUserId);

            var existing = await _repository.Friendship.GetBetweenAsync(
                currentUserId, targetUserId, trackChanges: true);

            if (existing is not null)
            {
                if (existing.Status == Friendship.Pending && existing.AddresseeId == currentUserId)
                    return await AcceptExistingAsync(existing);

                throw new FriendshipAlreadyExistsException();
            }

            var friendship = new Friendship
            {
                RequesterId = currentUserId,
                AddresseeId = targetUserId,
                Status = Friendship.Pending
            };

            _repository.Friendship.CreateFriendship(friendship);

            try
            {
                await _repository.SaveAsync();
            }
            catch (DuplicateResourceException)
            {
                return await AcceptRaceWinnerAsync(targetUserId);
            }

            await _notifier.FriendRequestReceivedAsync(new[] { targetUserId },
                await BuildDtoAsync(friendship, currentUserId));

            return await BuildDtoAsync(friendship, targetUserId);
        }

        public async Task<FriendDto> AcceptAsync(int requesterUserId)
        {
            await EnsureNotBlockedAsync(requesterUserId);

            var friendship = await _repository.Friendship.GetBetweenAsync(
                _currentUser.UserId, requesterUserId, trackChanges: true);

            if (friendship is null || friendship.Status != Friendship.Pending)
                throw new FriendshipNotFoundException(requesterUserId);

            if (friendship.AddresseeId != _currentUser.UserId)
                throw new FriendshipNotFoundException(requesterUserId);

            return await AcceptExistingAsync(friendship);
        }

        public async Task RemoveAsync(int otherUserId)
        {
            var friendship = await _repository.Friendship.GetBetweenAsync(
                _currentUser.UserId, otherUserId, trackChanges: true);

            if (friendship is null)
                throw new FriendshipNotFoundException(otherUserId);

            _repository.Friendship.DeleteFriendship(friendship);
            await _repository.SaveAsync();

            await _notifier.FriendshipRemovedAsync(new[] { otherUserId }, _currentUser.UserId);
        }

        public Task<bool> AreFriendsAsync(int otherUserId) =>
            _repository.Friendship.AreFriendsAsync(_currentUser.UserId, otherUserId);

        private async Task EnsureNotBlockedAsync(int otherUserId)
        {
            if (await _repository.UserBlock.IsBlockedEitherWayAsync(_currentUser.UserId, otherUserId))
                throw new BlockedUserException();
        }

        private async Task<FriendDto> AcceptRaceWinnerAsync(int targetUserId)
        {
            var winner = await _repository.Friendship.GetBetweenAsync(
                _currentUser.UserId, targetUserId, trackChanges: true);

            if (winner is null)
                throw new ConcurrentUpdateException();

            if (winner.Status == Friendship.Pending && winner.AddresseeId == _currentUser.UserId)
                return await AcceptExistingAsync(winner);

            throw new FriendshipAlreadyExistsException();
        }

        private async Task<FriendDto> AcceptExistingAsync(Friendship friendship)
        {
            friendship.Status = Friendship.Accepted;
            friendship.RespondedAt = DateTime.UtcNow;
            await _repository.SaveAsync();

            var currentUserId = _currentUser.UserId;
            var otherUserId = OtherUserId(friendship, currentUserId);

            await _notifier.FriendshipAcceptedAsync(new[] { otherUserId },
                await BuildDtoAsync(friendship, currentUserId));

            return await BuildDtoAsync(friendship, otherUserId);
        }

        private static int OtherUserId(Friendship friendship, int viewerId) =>
            friendship.RequesterId == viewerId ? friendship.AddresseeId : friendship.RequesterId;

        private async Task<FriendDto> BuildDtoAsync(Friendship friendship, int aboutUserId)
        {
            var user = await _repository.User.GetUserAsync(aboutUserId, trackChanges: false)
                ?? throw new UserNotFoundException(aboutUserId);

            return new FriendDto
            {
                UserId = user.Id,
                UserName = user.UserName!,
                Name = user.Name,
                Surname = user.Surname,
                AvatarUpdatedAt = user.AvatarUpdatedAt,
                Status = friendship.Status,
                IsIncoming = friendship.AddresseeId != aboutUserId,
                CreatedAt = friendship.CreatedAt
            };
        }

        private FriendDto ToDto(Friendship friendship)
        {
            var currentUserId = _currentUser.UserId;
            var isIncoming = friendship.AddresseeId == currentUserId;
            var other = isIncoming ? friendship.Requester : friendship.Addressee;

            return new FriendDto
            {
                UserId = other.Id,
                UserName = other.UserName!,
                Name = other.Name,
                Surname = other.Surname,
                AvatarUpdatedAt = other.AvatarUpdatedAt,
                Status = friendship.Status,
                IsIncoming = isIncoming,
                CreatedAt = friendship.CreatedAt
            };
        }

        private async Task EnsureUserExistsAsync(int userId)
        {
            var user = await _repository.User.GetUserAsync(userId, trackChanges: false);
            if (user is null)
                throw new UserNotFoundException(userId);
        }
    }
}
