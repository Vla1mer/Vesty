using Contracts;
using Entities.Models;

namespace internship.Services
{
    public class UserService
    {
        private readonly IRepositoryManager _repository;

        public UserService(IRepositoryManager repository)
            => _repository = repository;

        public async Task<IEnumerable<User>> GetAllAsync() =>
            await _repository.User.GetAllUsersAsync(trackChanges: false);

        public async Task<User?> GetByIdAsync(int id) =>
            await _repository.User.GetUserAsync(id, trackChanges: false);

        public async Task<User> CreateAsync(User user)
        {
            user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);
            user.CreatedAt = DateTime.UtcNow;
            _repository.User.CreateUser(user);
            await _repository.SaveAsync();
            return user;
        }

        public async Task<User?> UpdateAsync(int id, User updated)
        {
            var user = await _repository.User.GetUserAsync(id, trackChanges: true);
            if (user == null) return null;

            user.Login = updated.Login;
            user.Name = updated.Name;
            user.Surname = updated.Surname;
            user.Phone = updated.Phone;
            user.Birthday = updated.Birthday;

            await _repository.SaveAsync();
            return user;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var user = await _repository.User.GetUserAsync(id, trackChanges: false);
            if (user == null) return false;

            _repository.User.DeleteUser(user);
            await _repository.SaveAsync();
            return true;
        }
    }
}