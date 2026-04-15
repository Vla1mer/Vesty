using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IChatMemberService
    {
        IEnumerable<UserDto> GetUsersByChatId(int chatId);
        ChatMemberDto AddUserToChat(int chatId, ChatMemberForCreationDto memberDto);
        void RemoveUserFromChat(int chatId, int userId);
    }
}