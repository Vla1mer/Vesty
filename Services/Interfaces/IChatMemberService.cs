using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IChatMemberService
    {
        IEnumerable<ChatMemberDto> GetAll();
        IEnumerable<UserDto> GetUsersByChatId(int chatId);
    }
}