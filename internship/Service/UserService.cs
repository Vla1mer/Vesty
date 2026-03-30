using Contracts;
using Entities.Models;

namespace internship.Services
{
    public class UserService
    {
        private readonly IRepositoryManager _repository;

        public UserService(IRepositoryManager repository)
            => _repository = repository;

        public IEnumerable<User> GetAll() =>
            _repository.User.GetAllUsers(trackChanges: false);

        public User? GetById(int id) =>
            _repository.User.GetUser(id, trackChanges: false);

        public User Create(User user)
        {
            user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);
            _repository.User.CreateUser(user);
            _repository.Save();
            return user;
        }

        public User? Update(int id, User updated)
        {
            var user = _repository.User.GetUser(id, trackChanges: true);
            if (user == null) return null;
            user.Login = updated.Login;
            user.Name = updated.Name;
            user.Surname = updated.Surname;
            user.Phone = updated.Phone;
            user.Birthday = updated.Birthday;
            _repository.Save();
            return user;
        }

        public bool Delete(int id)
        {
            var user = _repository.User.GetUser(id, trackChanges: false);
            if (user == null) return false;
            _repository.User.DeleteUser(user);
            _repository.Save();
            return true;
        }
    }
}