using Entities.Models;

namespace Repository.Interfaces
{
    public interface IChatMemberRepository
    {
        IEnumerable<ChatMember> GetAllMembers(bool trackChanges);

    }
}