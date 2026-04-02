using Repository.Interfaces;
using Entities.Models;

namespace Repository
{
    public class ChatMemberRepository : RepositoryBase<ChatMember>, IChatMemberRepository
    {
        public ChatMemberRepository(AppDbContext context) : base(context) { }

        public IEnumerable<ChatMember> GetAllMembers(bool trackChanges) =>
            FindAll(trackChanges).ToList();

        public ChatMember? GetMember(int chatId, int userId, bool trackChanges) =>
            FindByCondition(cm => cm.ChatId == chatId && cm.UserId == userId, trackChanges).SingleOrDefault();
    }
}