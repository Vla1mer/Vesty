using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;

namespace Repository
{
    public class ChatMemberRepository : RepositoryBase<ChatMember>, IChatMemberRepository
    {
        public ChatMemberRepository(AppDbContext context) : base(context) { }

        public ChatMember? GetMember(int chatId, int userId, bool trackChanges) =>
            FindByCondition(cm => cm.ChatId == chatId && cm.UserId == userId, trackChanges).FirstOrDefault();

        public IEnumerable<User> GetUsersByChatId(int chatId, bool trackChanges) =>
             FindByCondition(cm => cm.ChatId == chatId, trackChanges)
            .Include(cm => cm.User)
            .Select(cm => cm.User)
            .ToList();

        public void CreateMember(ChatMember member) => Create(member);

        public void DeleteMember(ChatMember member) => Delete(member);
    }
}