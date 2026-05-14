using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IChatMemberService
    {
        Task<IEnumerable<UserDto>> GetUsersByChatIdAsync(int chatId, int currentUserId);
        Task<ChatMemberDto> AddUserToChatAsync(int chatId, int currentUserId, ChatMemberForCreationDto memberDto);
        Task RemoveUserFromChatAsync(int chatId, int targetUserId, int currentUserId);
        Task UpdateMemberRoleAsync(int chatId, int targetUserId, int currentUserId, ChatMemberRoleForUpdateDto roleDto);
    }
}
