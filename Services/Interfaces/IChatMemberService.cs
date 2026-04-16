using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IChatMemberService
    {
        Task<IEnumerable<UserDto>> GetUsersByChatIdAsync(int chatId);
        Task<ChatMemberDto> AddUserToChatAsync(int chatId, ChatMemberForCreationDto memberDto);
        Task RemoveUserFromChatAsync(int chatId, int userId);
    }
}