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

        public ChatMemberService(IRepositoryManager repository, ILoggerManager logger, IMapper mapper)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<IEnumerable<UserDto>> GetUsersByChatIdAsync(int chatId, int currentUserId)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            await EnsureUserIsChatMember(chatId, currentUserId);
            var users = await _repository.ChatMember.GetUsersByChatIdAsync(chatId, trackChanges: false);
            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public async Task<ChatMemberDto> AddUserToChatAsync(int chatId, int currentUserId, ChatMemberForCreationDto memberDto)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            if (chat.IsPrivate)
                throw new OperationNotAllowedInPrivateChatException("add members");

            var caller = await _repository.ChatMember.GetMemberAsync(chatId, currentUserId, trackChanges: false);
            if (caller is null || (caller.RoleId != ChatRoleIds.Owner && caller.RoleId != ChatRoleIds.Admin))
                throw new InsufficientChatPermissionException("invite members", chatId);

            var user = await _repository.User.GetUserAsync(memberDto.UserId, trackChanges: false);
            if (user is null)
                throw new UserNotFoundException(memberDto.UserId);

            var existing = await _repository.ChatMember.GetMemberAsync(chatId, memberDto.UserId, trackChanges: false);
            if (existing is not null)
                throw new UserAlreadyInChatException(chatId, memberDto.UserId);

            var member = new ChatMember { ChatId = chatId, UserId = memberDto.UserId };
            _repository.ChatMember.CreateMember(member);
            await _repository.SaveAsync();
            return _mapper.Map<ChatMemberDto>(member);
        }

        public async Task RemoveUserFromChatAsync(int chatId, int targetUserId, int currentUserId)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            if (chat.IsPrivate)
                throw new OperationNotAllowedInPrivateChatException("remove members");

            var target = await _repository.ChatMember.GetMemberAsync(chatId, targetUserId, trackChanges: false);
            if (target is null)
                throw new ChatMemberNotFoundException(chatId, targetUserId);

            if (targetUserId == currentUserId)
            {
                if (target.RoleId == ChatRoleIds.Owner)
                    throw new InvalidRoleAssignmentException("Owner cannot leave the chat.");
            }
            else
            {
                var caller = await _repository.ChatMember.GetMemberAsync(chatId, currentUserId, trackChanges: false);
                if (caller is null)
                    throw new InsufficientChatPermissionException("remove members", chatId);

                var allowed = caller.RoleId switch
                {
                    ChatRoleIds.Owner => target.RoleId != ChatRoleIds.Owner,
                    ChatRoleIds.Admin => target.RoleId == ChatRoleIds.User,
                    _ => false
                };
                if (!allowed)
                    throw new InsufficientChatPermissionException("remove this member", chatId);
            }

            _repository.ChatMember.DeleteMember(target);
            await _repository.SaveAsync();
        }

        public async Task UpdateMemberRoleAsync(int chatId, int targetUserId, int currentUserId, ChatMemberRoleForUpdateDto roleDto)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            if (chat.IsPrivate)
                throw new OperationNotAllowedInPrivateChatException("change roles");

            var caller = await _repository.ChatMember.GetMemberAsync(chatId, currentUserId, trackChanges: false);
            if (caller is null || caller.RoleId != ChatRoleIds.Owner)
                throw new OnlyOwnerCanChangeRolesException(chatId);

            var target = await _repository.ChatMember.GetMemberAsync(chatId, targetUserId, trackChanges: true);
            if (target is null)
                throw new ChatMemberNotFoundException(chatId, targetUserId);

            if (target.RoleId == ChatRoleIds.Owner)
                throw new InvalidRoleAssignmentException("Owner role cannot be changed.");

            if (roleDto.RoleId == ChatRoleIds.Owner)
                throw new InvalidRoleAssignmentException("Owner role cannot be granted to another member.");

            if (roleDto.RoleId != ChatRoleIds.Admin && roleDto.RoleId != ChatRoleIds.User)
                throw new InvalidRoleAssignmentException($"Unknown role id: {roleDto.RoleId}.");

            target.RoleId = roleDto.RoleId;
            await _repository.SaveAsync();
        }

        private async Task EnsureUserIsChatMember(int chatId, int userId)
        {
            var isMember = await _repository.ChatMember.IsUserInChatAsync(chatId, userId);
            if (!isMember)
                throw new ChatAccessDeniedException(chatId, userId);
        }
    }
}
