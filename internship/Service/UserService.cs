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

    }
}