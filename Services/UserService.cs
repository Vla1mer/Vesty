using AutoMapper;
using Repository.Interfaces;
using Entities.Exceptions;
using Services.Interfaces;
using Services.DataTransferObjects;

namespace Services
{
    public class UserService : IUserService
    {
        private readonly IRepositoryManager _repository;
        private readonly ILoggerManager _logger;
        private readonly IMapper _mapper;

        public UserService(IRepositoryManager repository, ILoggerManager logger, IMapper mapper)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
        }

        public IEnumerable<UserDto> GetAll()
        {
            var users = _repository.User.GetAllUsers(trackChanges: false);
            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public UserDto GetById(int id)
        {
            var user = _repository.User.GetUser(id, trackChanges: false);
            if (user is null)
                throw new UserNotFoundException(id);

            return _mapper.Map<UserDto>(user);
        }
    }
}