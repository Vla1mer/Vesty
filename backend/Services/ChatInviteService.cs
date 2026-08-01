using System.Security.Cryptography;
using Entities.Models;
using Repository.Interfaces;
using Services.DataTransferObjects;
using Services.Interfaces;
using Shared.Exceptions;

namespace Services
{
    public class ChatInviteService : IChatInviteService
    {
        private const int CodeBytes = 12;
        private const int MaxExpiryDays = 365;

        private readonly IRepositoryManager _repository;
        private readonly ICurrentUserService _currentUser;
        private readonly IChatNotifier _notifier;

        public ChatInviteService(IRepositoryManager repository, ICurrentUserService currentUser,
            IChatNotifier notifier)
        {
            _repository = repository;
            _currentUser = currentUser;
            _notifier = notifier;
        }

        public async Task<ChatInviteDto?> GetActiveAsync(int chatId)
        {
            var chat = await GetGroupChatOrThrowAsync(chatId);
            await EnsureCallerCanInviteAsync(chat);

            var invite = await _repository.ChatInvite.GetActiveByChatAsync(
                chatId, DateTime.UtcNow, trackChanges: false);
            return invite is null ? null : ToDto(invite);
        }

        public async Task<ChatInviteDto> CreateAsync(int chatId, ChatInviteForCreationDto dto)
        {
            var chat = await GetGroupChatOrThrowAsync(chatId);
            await EnsureCallerCanInviteAsync(chat);

            if (dto.ExpiresInDays is int days && (days < 1 || days > MaxExpiryDays))
                throw new InvalidInviteExpiryException(days);

            await RevokeActiveAsync(chatId);

            var invite = new ChatInvite
            {
                ChatId = chatId,
                Code = GenerateCode(),
                CreatedById = _currentUser.UserId,
                ExpiresAt = dto.ExpiresInDays is int d ? DateTime.UtcNow.AddDays(d) : null
            };
            _repository.ChatInvite.CreateInvite(invite);
            await _repository.SaveAsync();

            return ToDto(invite);
        }

        public async Task RevokeAsync(int chatId)
        {
            var chat = await GetGroupChatOrThrowAsync(chatId);
            await EnsureCallerCanInviteAsync(chat);

            await RevokeActiveAsync(chatId);
            await _repository.SaveAsync();
        }

        public async Task<ChatInvitePreviewDto> PreviewAsync(string code)
        {
            var invite = await GetUsableInviteOrThrowAsync(code);
            var members = await _repository.ChatMember.GetMembersByChatIdAsync(
                invite.ChatId, trackChanges: false);

            return new ChatInvitePreviewDto
            {
                ChatId = invite.ChatId,
                Name = invite.Chat.Name,
                Description = invite.Chat.Description,
                MemberCount = members.Count(),
                AvatarUpdatedAt = invite.Chat.AvatarUpdatedAt,
                AlreadyMember = members.Any(m => m.UserId == _currentUser.UserId)
            };
        }

        public async Task<int> JoinAsync(string code)
        {
            var invite = await GetUsableInviteOrThrowAsync(code);
            var userId = _currentUser.UserId;

            if (await _repository.ChatMember.IsUserInChatAsync(invite.ChatId, userId))
                return invite.ChatId;

            _repository.ChatMember.CreateMember(new ChatMember
            {
                ChatId = invite.ChatId,
                UserId = userId,
                RoleId = UserRole.User
            });
            await _repository.SaveAsync();

            await _notifier.ChatUpdatedAsync(
                await GetMemberIdsAsync(invite.ChatId),
                new ChatUpdatedSignalrDto { ChatId = invite.ChatId });

            return invite.ChatId;
        }

        private async Task RevokeActiveAsync(int chatId)
        {
            var now = DateTime.UtcNow;
            foreach (var active in await _repository.ChatInvite.GetActiveByChatForRevokeAsync(chatId, now))
                active.RevokedAt = now;
        }

        private async Task<ChatInvite> GetUsableInviteOrThrowAsync(string code)
        {
            var invite = await _repository.ChatInvite.GetByCodeAsync(code, trackChanges: false);
            if (invite is null || !invite.IsActive(DateTime.UtcNow) || invite.Chat.IsPrivate)
                throw new InviteNotFoundException();
            return invite;
        }

        private async Task<Chat> GetGroupChatOrThrowAsync(int chatId)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false)
                ?? throw new ChatNotFoundException(chatId);
            if (chat.IsPrivate)
                throw new OperationNotAllowedInPrivateChatException("share an invite link");
            return chat;
        }

        private async Task EnsureCallerCanInviteAsync(Chat chat)
        {
            var caller = await _currentUser.GetMembershipAsync(chat.Id);
            if (caller is null || !ChatPermission.Allows(chat.WhoCanInvite, caller.RoleId))
                throw new InsufficientChatPermissionException("share an invite link", chat.Id);
        }

        private async Task<List<int>> GetMemberIdsAsync(int chatId)
        {
            var members = await _repository.ChatMember.GetMembersByChatIdAsync(chatId, trackChanges: false);
            return members.Select(m => m.UserId).ToList();
        }

        private static string GenerateCode() =>
            Convert.ToBase64String(RandomNumberGenerator.GetBytes(CodeBytes))
                .Replace("+", "-")
                .Replace("/", "_")
                .TrimEnd('=');

        private static ChatInviteDto ToDto(ChatInvite invite) =>
            new()
            {
                Code = invite.Code,
                ExpiresAt = invite.ExpiresAt,
                CreatedAt = invite.CreatedAt
            };
    }
}
