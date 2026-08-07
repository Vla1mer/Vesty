using Entities.Models;
using Repository.Interfaces;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace Services
{
    public sealed class PresenceService : IPresenceService
    {
        private readonly IRepositoryManager _repository;
        private readonly ICurrentUserService _currentUser;
        private readonly IPresenceTracker _presence;
        private readonly IChatNotifier _notifier;

        public PresenceService(IRepositoryManager repository, ICurrentUserService currentUser,
            IPresenceTracker presence, IChatNotifier notifier)
        {
            _repository = repository;
            _currentUser = currentUser;
            _presence = presence;
            _notifier = notifier;
        }

        public async Task RecordLastSeenAsync(int userId)
        {
            var user = await _repository.User.GetUserAsync(userId, trackChanges: true);
            if (user is null)
                return;

            user.LastSeenAt = DateTime.UtcNow;
            await _repository.SaveAsync();
        }

        public async Task<IEnumerable<UserPresenceDto>> GetPresenceAsync(IEnumerable<int> userIds)
        {
            var wanted = userIds.Distinct().ToList();
            if (wanted.Count == 0)
                return [];

            var users = (await _repository.User.GetByIdsAsync(wanted, trackChanges: false)).ToList();
            var visible = await VisibleIdsAsync(users);

            return users.Select(user => visible.Contains(user.Id)
                ? new UserPresenceDto
                {
                    UserId = user.Id,
                    IsOnline = _presence.IsOnline(user.Id),
                    LastSeenAt = user.LastSeenAt
                }
                : new UserPresenceDto { UserId = user.Id })
                .ToList();
        }

        public async Task AnnouncePresenceAsync(int userId, bool isOnline)
        {
            var user = await _repository.User.GetUserAsync(userId, trackChanges: false);
            if (user is null || user.WhoCanSeeOnline == PrivacyLevel.Nobody)
                return;

            var partnerIds = (await _repository.ChatMember.GetChatPartnerIdsAsync(userId)).ToList();
            if (partnerIds.Count == 0)
                return;

            var friendIds = user.WhoCanSeeOnline == PrivacyLevel.FriendsOnly
                ? (await _repository.Friendship.GetFriendIdsAsync(userId)).ToHashSet()
                : new HashSet<int>();
            var blocked = (await _repository.UserBlock.GetRelatedUserIdsAsync(userId)).ToHashSet();

            var recipients = partnerIds
                .Where(id => !blocked.Contains(id) && MaySee(user, friendIds.Contains(id)))
                .ToList();

            if (recipients.Count == 0)
                return;

            await _notifier.PresenceChangedAsync(recipients, new UserPresenceDto
            {
                UserId = userId,
                IsOnline = isOnline,
                LastSeenAt = user.LastSeenAt
            });
        }

        private static bool MaySee(User owner, bool areFriends) =>
            owner.WhoCanSeeOnline == PrivacyLevel.Everyone ||
            (owner.WhoCanSeeOnline == PrivacyLevel.FriendsOnly && areFriends);

        private async Task<HashSet<int>> VisibleIdsAsync(IReadOnlyCollection<User> users)
        {
            var currentUserId = _currentUser.UserId;
            var others = users.Where(u => u.Id != currentUserId).ToList();

            var blocked = others.Count > 0
                ? (await _repository.UserBlock.GetRelatedUserIdsAsync(currentUserId)).ToHashSet()
                : new HashSet<int>();

            var friends = others.Any(u => u.WhoCanSeeOnline == PrivacyLevel.FriendsOnly)
                ? (await _repository.Friendship.GetFriendIdsAsync(currentUserId)).ToHashSet()
                : new HashSet<int>();

            return users
                .Where(user => user.Id == currentUserId ||
                    (!blocked.Contains(user.Id) && MaySee(user, friends.Contains(user.Id))))
                .Select(user => user.Id)
                .ToHashSet();
        }
    }
}
