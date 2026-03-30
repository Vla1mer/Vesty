using Entities.Models;

namespace Contracts
{
    public interface IChatMemberRepository
    {
        IEnumerable<ChatMember> GetAllMembers(bool trackChanges);

    }
}