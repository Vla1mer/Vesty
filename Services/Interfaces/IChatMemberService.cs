using Entities.Models;
using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IChatMemberService
    {
        IEnumerable<ChatMemberDto> GetAll();
        ChatMemberDto GetById(int chatId, int userId);
    }
}