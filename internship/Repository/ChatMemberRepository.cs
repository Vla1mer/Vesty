using Contracts;
using Entities.Models;
using Microsoft.EntityFrameworkCore;

namespace internship.Repository
{
    public class ChatMemberRepository : RepositoryBase<ChatMember>, IChatMemberRepository
    {
        public ChatMemberRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<ChatMember>> GetAllMembersAsync(bool trackChanges) =>
            await FindAll(trackChanges).ToListAsync();

        public async Task<ChatMember?> GetMemberAsync(int chatId, int userId, bool trackChanges) =>
            await FindByCondition(cm => cm.ChatId == chatId && cm.UserId == userId, trackChanges)
                .FirstOrDefaultAsync();

        public void CreateMember(ChatMember member) => Create(member);
        public void DeleteMember(ChatMember member) => Delete(member);
    }
}