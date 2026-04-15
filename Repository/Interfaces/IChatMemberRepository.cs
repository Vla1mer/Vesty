using Entities.Models;

namespace Repository.Interfaces
{
    public interface IChatMemberRepository
    {
        IEnumerable<User> GetUsersByChatId(int chatId, bool trackChanges);
        ChatMember? GetMember(int chatId, int userId, bool trackChanges);
        void CreateMember(ChatMember member);
        void DeleteMember(ChatMember member);
    }
}