using AutoMapper;
using Shared.Exceptions;
using Entities.Models;
using Repository.Interfaces;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace Services
{
    public class ChatMemberService : IChatMemberService
    {
        private readonly IRepositoryManager _repository;
        private readonly ILoggerManager _logger;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUser;
        private readonly IChatNotifier _notifier;

        public ChatMemberService(IRepositoryManager repository, ILoggerManager logger, IMapper mapper,
            ICurrentUserService currentUser, IChatNotifier notifier)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
            _currentUser = currentUser;
            _notifier = notifier;
        }

        public async Task<IEnumerable<ChatMemberWithRoleDto>> GetUsersByChatIdAsync(int chatId)
        {
            await GetChatOrThrowAsync(chatId);
            await EnsureCallerIsChatMember(chatId);
            var members = await _repository.ChatMember.GetMembersByChatIdAsync(chatId, trackChanges: false);
            return _mapper.Map<IEnumerable<ChatMemberWithRoleDto>>(members);
        }

        public async Task<ChatMemberDto> AddUserToChatAsync(int chatId, ChatMemberForCreationDto memberDto)
        {
            var chat = await GetChatOrThrowAsync(chatId, mustBeGroupChat: "add members");
            await EnsureCallerCanInvite(chatId);
            await EnsureUserExistsAsync(memberDto.UserId);
            await EnsureUserNotInChatAsync(chatId, memberDto.UserId);

            var member = new ChatMember { ChatId = chatId, UserId = memberDto.UserId };
            _repository.ChatMember.CreateMember(member);
            await _repository.SaveAsync();

            await _notifier.ChatCreatedAsync(new[] { memberDto.UserId }, _mapper.Map<ChatDto>(chat));

            return _mapper.Map<ChatMemberDto>(member);
        }

        public async Task RemoveUserFromChatAsync(int chatId, int targetUserId)
        {
            var currentUserId = _currentUser.UserId;
            await GetChatOrThrowAsync(chatId, mustBeGroupChat: "remove members");

            var target = await GetMemberOrThrowAsync(chatId, targetUserId);

            if (targetUserId == currentUserId)
            {
                if (target.RoleId == UserRole.Owner)
                    throw new InvalidRoleAssignmentException("Owner cannot leave the chat.");
            }
            else
            {
                EnsureCallerCanRemove(chatId, await GetCallerMembershipAsync(chatId, "remove members"), target);
            }

            _repository.ChatMember.DeleteMember(target);
            await _repository.SaveAsync();

            await _notifier.ChatDeletedAsync(new[] { targetUserId }, new ChatDeletedDto { ChatId = chatId });
        }

        public async Task UpdateMemberRoleAsync(int chatId, int targetUserId, ChatMemberRoleForUpdateDto roleDto)
        {
            await GetChatOrThrowAsync(chatId, mustBeGroupChat: "change roles");

            var caller = await GetCallerMembershipAsync(chatId, "change roles");
            if (caller.RoleId != UserRole.Owner)
                throw new OnlyOwnerCanChangeRolesException(chatId);

            var target = await GetMemberOrThrowAsync(chatId, targetUserId, trackChanges: true);

            if (target.RoleId == UserRole.Owner)
                throw new InvalidRoleAssignmentException("Owner role cannot be changed.");

            if (roleDto.RoleId == UserRole.Owner)
                throw new InvalidRoleAssignmentException("Owner role cannot be granted to another member.");

            if (roleDto.RoleId != UserRole.Admin && roleDto.RoleId != UserRole.User)
                throw new InvalidRoleAssignmentException($"Unknown role id: {roleDto.RoleId}.");

            target.RoleId = roleDto.RoleId;
            await _repository.SaveAsync();
        }

        private async Task<Chat> GetChatOrThrowAsync(int chatId, string? mustBeGroupChat = null)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            if (mustBeGroupChat is not null && chat.IsPrivate)
                throw new OperationNotAllowedInPrivateChatException(mustBeGroupChat);
            return chat;
        }

        private async Task<ChatMember> GetMemberOrThrowAsync(int chatId, int userId, bool trackChanges = false)
        {
            var member = userId == _currentUser.UserId && !trackChanges
                ? await _currentUser.GetMembershipAsync(chatId)
                : await _repository.ChatMember.GetMemberAsync(chatId, userId, trackChanges);
            if (member is null)
                throw new ChatMemberNotFoundException(chatId, userId);
            return member;
        }

        private async Task<ChatMember> GetCallerMembershipAsync(int chatId, string action)
        {
            var caller = await _currentUser.GetMembershipAsync(chatId);
            if (caller is null)
                throw new InsufficientChatPermissionException(action, chatId);
            return caller;
        }

        private async Task EnsureCallerIsChatMember(int chatId)
        {
            var member = await _currentUser.GetMembershipAsync(chatId);
            if (member is null)
                throw new ChatAccessDeniedException(chatId, _currentUser.UserId);
        }

        private async Task EnsureCallerCanInvite(int chatId)
        {
            var caller = await _currentUser.GetMembershipAsync(chatId);
            if (caller is null || (caller.RoleId != UserRole.Owner && caller.RoleId != UserRole.Admin))
                throw new InsufficientChatPermissionException("invite members", chatId);
        }

        private static void EnsureCallerCanRemove(int chatId, ChatMember caller, ChatMember target)
        {
            var allowed = caller.RoleId switch
            {
                UserRole.Owner => target.RoleId != UserRole.Owner,
                UserRole.Admin => target.RoleId == UserRole.User,
                _ => false
            };
            if (!allowed)
                throw new InsufficientChatPermissionException("remove this member", chatId);
        }

        private async Task EnsureUserExistsAsync(int userId)
        {
            var user = await _repository.User.GetUserAsync(userId, trackChanges: false);
            if (user is null)
                throw new UserNotFoundException(userId);
        }

        private async Task EnsureUserNotInChatAsync(int chatId, int userId)
        {
            if (await _repository.ChatMember.IsUserInChatAsync(chatId, userId))
                throw new UserAlreadyInChatException(chatId, userId);
        }
    }
}
