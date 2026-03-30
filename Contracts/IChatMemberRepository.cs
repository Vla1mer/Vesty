using Entities.Models;

namespace Contracts
{
    public interface IChatMemberRepository
    {
        IEnumerable<ChatMember> GetAllMembers(bool trackChanges);
        ChatMember? GetMember(int chatId, int userId, bool trackChanges);
        void CreateMember(ChatMember member);
        void DeleteMember(ChatMember member);
    }
}