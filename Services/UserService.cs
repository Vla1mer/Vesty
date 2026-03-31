using Repository.Interfaces;
using Entities.Models;
using Services.Interfaces;

namespace Services
{
    public class UserService : IUserService
    {
        private readonly IRepositoryManager _repository;

        public UserService(IRepositoryManager repository)
            => _repository = repository;

        public IEnumerable<User> GetAll() =>
            _repository.User.GetAllUsers(trackChanges: false);
    }
}