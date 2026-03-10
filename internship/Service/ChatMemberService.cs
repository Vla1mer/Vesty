using internship.Models;
using Microsoft.EntityFrameworkCore;

namespace internship.Services
{
    public class ChatMemberService
    {
        private readonly AppDbContext _db;

        public ChatMemberService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<ChatMember>> GetAllAsync()
        {
            return await _db.ChatMembers.ToListAsync();
        }

        public async Task<ChatMember?> GetByIdAsync(int chatId, int userId)
        {
            return await _db.ChatMembers.FindAsync(chatId, userId);
        }

        public async Task<ChatMember> CreateAsync(ChatMember member)
        {
            member.CreatedAt = DateTime.UtcNow;
            _db.ChatMembers.Add(member);
            await _db.SaveChangesAsync();
            return member;
        }

        public async Task<bool> DeleteAsync(int chatId, int userId)
        {
            var member = await _db.ChatMembers.FindAsync(chatId, userId);
            if (member == null) return false;

            _db.ChatMembers.Remove(member);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}