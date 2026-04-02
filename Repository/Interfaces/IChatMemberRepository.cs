using Entities.Models;

namespace Repository.Interfaces
{
    public interface IChatMemberRepository
    {
        IEnumerable<ChatMember> GetAllMembers(bool trackChanges);
        ChatMember? GetMember(int chatId, int userId, bool trackChanges);
    }
}