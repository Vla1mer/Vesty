using Entities.Models;
using Repository.Interfaces;
using Services.DataTransferObjects;
using Services.Interfaces;
using Shared.Exceptions;

namespace Services
{
    public class AvatarService : IAvatarService
    {
        public const int MaxSizeInBytes = 300 * 1024;

        private static readonly HashSet<string> AllowedContentTypes =
            new(StringComparer.OrdinalIgnoreCase) { "image/jpeg", "image/png", "image/webp" };

        private readonly IRepositoryManager _repository;
        private readonly ICurrentUserService _currentUser;

        public AvatarService(IRepositoryManager repository, ICurrentUserService currentUser)
        {
            _repository = repository;
            _currentUser = currentUser;
        }

        public async Task<AvatarDto?> GetAsync(int userId)
        {
            var user = await GetUserOrThrowAsync(userId, trackChanges: false);
            if (user.AvatarUpdatedAt is null)
                return null;

            var avatar = await _repository.Avatar.GetAvatarAsync(userId, trackChanges: false);
            if (avatar is null)
                return null;

            return new AvatarDto
            {
                Data = avatar.Data,
                ContentType = avatar.ContentType,
                UpdatedAt = user.AvatarUpdatedAt.Value
            };
        }

        public async Task SetAsync(int userId, Stream content, string? contentType, long length)
        {
            EnsureCallerOwnsAccount(userId);

            if (length <= 0)
                throw new InvalidAvatarException("file is empty.");
            if (length > MaxSizeInBytes)
                throw new InvalidAvatarException($"maximum size is {MaxSizeInBytes / 1024} KB.");
            if (contentType is null || !AllowedContentTypes.Contains(contentType))
                throw new InvalidAvatarException("allowed formats are JPEG, PNG and WebP.");

            var user = await GetUserOrThrowAsync(userId, trackChanges: true);
            var data = await ReadAllBytesAsync(content);

            if (data.Length > MaxSizeInBytes)
                throw new InvalidAvatarException($"maximum size is {MaxSizeInBytes / 1024} KB.");

            var avatar = await _repository.Avatar.GetAvatarAsync(userId, trackChanges: true);
            if (avatar is null)
            {
                _repository.Avatar.CreateAvatar(new UserAvatar
                {
                    UserId = userId,
                    Data = data,
                    ContentType = contentType
                });
            }
            else
            {
                avatar.Data = data;
                avatar.ContentType = contentType;
            }

            user.AvatarUpdatedAt = DateTime.UtcNow;
            await _repository.SaveAsync();
        }

        public async Task DeleteAsync(int userId)
        {
            EnsureCallerOwnsAccount(userId);

            var user = await GetUserOrThrowAsync(userId, trackChanges: true);
            var avatar = await _repository.Avatar.GetAvatarAsync(userId, trackChanges: true);
            if (avatar is not null)
                _repository.Avatar.DeleteAvatar(avatar);

            user.AvatarUpdatedAt = null;
            await _repository.SaveAsync();
        }

        private void EnsureCallerOwnsAccount(int userId)
        {
            if (userId != _currentUser.UserId)
                throw new UserSelfModificationException();
        }

        private async Task<User> GetUserOrThrowAsync(int userId, bool trackChanges)
        {
            var user = await _repository.User.GetUserAsync(userId, trackChanges);
            if (user is null)
                throw new UserNotFoundException(userId);
            return user;
        }

        private static async Task<byte[]> ReadAllBytesAsync(Stream content)
        {
            using var buffer = new MemoryStream();
            await content.CopyToAsync(buffer);
            return buffer.ToArray();
        }
    }
}
