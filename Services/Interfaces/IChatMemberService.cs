using Entities.Models;

namespace Services.Interfaces
{
    public interface IChatMemberService
    {
        IEnumerable<ChatMember> GetAll();
    }
}