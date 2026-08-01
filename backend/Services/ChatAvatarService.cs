using Entities.Models;
using Repository.Interfaces;
using Services.DataTransferObjects;
using Services.Interfaces;
using Shared.Exceptions;

namespace Services
{
    public class ChatAvatarService : IChatAvatarService
    {
        private readonly IRepositoryManager _repository;
        private readonly ICurrentUserService _currentUser;

        public ChatAvatarService(IRepositoryManager repository, ICurrentUserService currentUser)
        {
            _repository = repository;
            _currentUser = currentUser;
        }

        public async Task<AvatarDto?> GetAsync(int chatId)
        {
            var chat = await GetChatOrThrowAsync(chatId, trackChanges: false);
            if (chat.AvatarUpdatedAt is null)
                return null;

            var avatar = await _repository.ChatAvatar.GetAvatarAsync(chatId, trackChanges: false);
            if (avatar is null)
                return null;

            return new AvatarDto
            {
                Data = avatar.Data,
                ContentType = avatar.ContentType,
                UpdatedAt = chat.AvatarUpdatedAt.Value
            };
        }

        public async Task SetAsync(int chatId, Stream content, string? contentType, long length)
        {
            AvatarContent.EnsureValid(contentType, length);

            var chat = await GetGroupChatForModerationAsync(chatId);
            var data = await AvatarContent.ReadAsync(content);

            var avatar = await _repository.ChatAvatar.GetAvatarAsync(chatId, trackChanges: true);
            if (avatar is null)
            {
                _repository.ChatAvatar.CreateAvatar(new ChatAvatar
                {
                    ChatId = chatId,
                    Data = data,
                    ContentType = contentType!
                });
            }
            else
            {
                avatar.Data = data;
                avatar.ContentType = contentType!;
            }

            chat.AvatarUpdatedAt = DateTime.UtcNow;
            await _repository.SaveAsync();
        }

        public async Task DeleteAsync(int chatId)
        {
            var chat = await GetGroupChatForModerationAsync(chatId);

            var avatar = await _repository.ChatAvatar.GetAvatarAsync(chatId, trackChanges: true);
            if (avatar is not null)
                _repository.ChatAvatar.DeleteAvatar(avatar);

            chat.AvatarUpdatedAt = null;
            await _repository.SaveAsync();
        }

        private async Task<Chat> GetGroupChatForModerationAsync(int chatId)
        {
            var chat = await GetChatOrThrowAsync(chatId, trackChanges: true);
            if (chat.IsPrivate)
                throw new OperationNotAllowedInPrivateChatException("change the chat avatar");

            var caller = await _currentUser.GetMembershipAsync(chatId);
            if (caller is null || !ChatPermission.Allows(chat.WhoCanEdit, caller.RoleId))
                throw new InsufficientChatPermissionException("change the chat avatar", chatId);

            return chat;
        }

        private async Task<Chat> GetChatOrThrowAsync(int chatId, bool trackChanges)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            return chat;
        }
    }
}
