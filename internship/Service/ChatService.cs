using internship.Models;
using Microsoft.EntityFrameworkCore;

namespace internship.Services
{
    public class ChatService
    {
        private readonly AppDbContext _db;

        public ChatService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<Chat>> GetAllAsync()
        {
            return await _db.Chats.ToListAsync();
        }

        public async Task<Chat?> GetByIdAsync(int id)
        {
            return await _db.Chats.FindAsync(id);
        }

        public async Task<Chat> CreateAsync(Chat chat)
        {
            chat.CreatedAt = DateTime.UtcNow;
            _db.Chats.Add(chat);
            await _db.SaveChangesAsync();
            return chat;
        }

        public async Task<Chat?> UpdateAsync(int id, Chat updated)
        {
            var chat = await _db.Chats.FindAsync(id);
            if (chat == null) return null;

            chat.Name = updated.Name;

            await _db.SaveChangesAsync();
            return chat;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var chat = await _db.Chats.FindAsync(id);
            if (chat == null) return false;

            _db.Chats.Remove(chat);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}