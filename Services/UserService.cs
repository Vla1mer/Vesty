using AutoMapper;
using Entities.Exceptions;
using Entities.Models;
using Repository.Interfaces;
using Services.DataTransferObjects;
using Services.Interfaces;

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

        public UserDto Create(UserForCreationDto userDto)
        {
            var user = _mapper.Map<User>(userDto);
            user.Password = BCrypt.Net.BCrypt.HashPassword(userDto.Password);
            _repository.User.CreateUser(user);
            _repository.Save();
            return _mapper.Map<UserDto>(user);
        }

        public IEnumerable<UserDto> GetByIds(IEnumerable<int> ids)
        {
            if (ids is null)
                throw new IdParametersBadRequestException();

            var users = _repository.User.GetByIds(ids, trackChanges: false);
            if (ids.Count() != users.Count())
                throw new CollectionByIdsBadRequestException();

            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public (IEnumerable<UserDto> users, string ids) CreateUserCollection(IEnumerable<UserForCreationDto> userCollection)
        {
            if (userCollection is null)
                throw new UserCollectionBadRequestException();

            var userEntities = _mapper.Map<IEnumerable<User>>(userCollection);
            foreach (var user in userEntities)
            {
                user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);
                _repository.User.CreateUser(user);
            }

            _repository.Save();

            var usersToReturn = _mapper.Map<IEnumerable<UserDto>>(userEntities);
            var ids = string.Join(",", usersToReturn.Select(u => u.Id));

            return (users: usersToReturn, ids: ids);
        }
    }
}