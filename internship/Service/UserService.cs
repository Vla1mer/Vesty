using internship.Models;
using Microsoft.EntityFrameworkCore;

namespace internship.Services
{
    public class UserService
    {
        private readonly AppDbContext _db;

        public UserService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<User>> GetAllAsync()
        {
            return await _db.Users.ToListAsync();
        }

        public async Task<User?> GetByIdAsync(int id)
        {
            return await _db.Users.FindAsync(id);
        }

        public async Task<User> CreateAsync(User user)
        {
            user.CreatedAt = DateTime.UtcNow;
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
            return user;
        }

        public async Task<User?> UpdateAsync(int id, User updated)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return null;

            user.Login = updated.Login;
            user.Name = updated.Name;
            user.Surname = updated.Surname;
            user.Phone = updated.Phone;
            user.Birthday = updated.Birthday;

            await _db.SaveChangesAsync();
            return user;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return false;

            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}