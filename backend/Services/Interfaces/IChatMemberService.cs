using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IChatMemberService
    {
        Task<IEnumerable<ChatMemberWithRoleDto>> GetUsersByChatIdAsync(int chatId);
        Task<ChatMemberDto> AddUserToChatAsync(int chatId, ChatMemberForCreationDto memberDto);
        Task RemoveUserFromChatAsync(int chatId, int targetUserId);
        Task UpdateMemberRoleAsync(int chatId, int targetUserId, ChatMemberRoleForUpdateDto roleDto);
        Task TransferOwnershipAsync(int chatId, int newOwnerUserId);
        Task<IEnumerable<int>> GetTypingRecipientsAsync(int chatId, int typingUserId);
    }
}
