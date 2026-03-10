using internship.Models;
using Microsoft.EntityFrameworkCore;

namespace internship.Services
{
    public class MessageService
    {
        private readonly AppDbContext _db;

        public MessageService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<Message>> GetAllAsync()
        {
            return await _db.Messages.ToListAsync();
        }

        public async Task<Message?> GetByIdAsync(int id)
        {
            return await _db.Messages.FindAsync(id);
        }

        public async Task<Message> CreateAsync(Message message)
        {
            message.CreatedAt = DateTime.UtcNow;
            _db.Messages.Add(message);
            await _db.SaveChangesAsync();
            return message;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var message = await _db.Messages.FindAsync(id);
            if (message == null) return false;

            _db.Messages.Remove(message);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}