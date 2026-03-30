using Contracts;
using Entities.Models;

namespace internship.Repository
{
    public class ChatMemberRepository : RepositoryBase<ChatMember>, IChatMemberRepository
    {
        public ChatMemberRepository(AppDbContext context) : base(context) { }

        public IEnumerable<ChatMember> GetAllMembers(bool trackChanges) =>
            FindAll(trackChanges).ToList();

        public ChatMember? GetMember(int chatId, int userId, bool trackChanges) =>
            FindByCondition(cm => cm.ChatId == chatId && cm.UserId == userId, trackChanges)
                .FirstOrDefault();

        public void CreateMember(ChatMember member) => Create(member);
        public void DeleteMember(ChatMember member) => Delete(member);
    }
}