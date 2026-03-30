using Contracts;
using Entities.Models;

namespace internship.Repository
{
    public class ChatMemberRepository : RepositoryBase<ChatMember>, IChatMemberRepository
    {
        public ChatMemberRepository(AppDbContext context) : base(context) { }

        public IEnumerable<ChatMember> GetAllMembers(bool trackChanges) =>
            FindAll(trackChanges).ToList();

    }
}