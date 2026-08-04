using Entities.Models;
using Repository.Interfaces;
using Services.DataTransferObjects;
using Services.Interfaces;
using Shared.Exceptions;

namespace Services
{
    public class BlockService : IBlockService
    {
        private readonly IRepositoryManager _repository;
        private readonly ICurrentUserService _currentUser;

        public BlockService(IRepositoryManager repository, ICurrentUserService currentUser)
        {
            _repository = repository;
            _currentUser = currentUser;
        }

        public async Task<IEnumerable<BlockedUserDto>> GetBlockedAsync()
        {
            var blocks = await _repository.UserBlock.GetByBlockerAsync(_currentUser.UserId);

            return blocks.Select(b => new BlockedUserDto
            {
                UserId = b.Blocked.Id,
                UserName = b.Blocked.UserName!,
                Name = b.Blocked.Name,
                Surname = b.Blocked.Surname,
                AvatarUpdatedAt = b.Blocked.AvatarUpdatedAt,
                CreatedAt = b.CreatedAt
            });
        }

        public async Task<(BlockedUserDto blocked, bool created)> BlockAsync(int targetUserId)
        {
            var currentUserId = _currentUser.UserId;
            if (targetUserId == currentUserId)
                throw new SelfBlockException();

            var target = await _repository.User.GetUserAsync(targetUserId, trackChanges: false)
                ?? throw new UserNotFoundException(targetUserId);

            var existing = await _repository.UserBlock.GetAsync(currentUserId, targetUserId, trackChanges: false);
            var block = existing;

            if (existing is null)
            {
                block = new UserBlock
                {
                    BlockerId = currentUserId,
                    BlockedId = targetUserId
                };
                _repository.UserBlock.CreateBlock(block);

                var friendship = await _repository.Friendship.GetBetweenAsync(
                    currentUserId, targetUserId, trackChanges: true);
                if (friendship is not null)
                    _repository.Friendship.DeleteFriendship(friendship);

                await _repository.SaveAsync();
            }

            var dto = new BlockedUserDto
            {
                UserId = target.Id,
                UserName = target.UserName!,
                Name = target.Name,
                Surname = target.Surname,
                AvatarUpdatedAt = target.AvatarUpdatedAt,
                CreatedAt = block!.CreatedAt
            };

            return (dto, created: existing is null);
        }

        public async Task UnblockAsync(int targetUserId)
        {
            var block = await _repository.UserBlock.GetAsync(
                _currentUser.UserId, targetUserId, trackChanges: true)
                ?? throw new BlockNotFoundException(targetUserId);

            _repository.UserBlock.DeleteBlock(block);
            await _repository.SaveAsync();
        }
    }
}
