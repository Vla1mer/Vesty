using AutoMapper;
using Entities.Exceptions;
using Entities.Models;
using Entities.RequestFeatures;
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

        public async Task<IEnumerable<UserDto>> GetAllAsync(UserParameters userParameters)
        {
            var users = await _repository.User.GetAllUsersAsync(userParameters, trackChanges: false);
            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public async Task<UserDto> GetByIdAsync(int id)
        {
            var user = await _repository.User.GetUserAsync(id, trackChanges: false);
            if (user is null)
                throw new UserNotFoundException(id);
            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto> CreateAsync(UserForCreationDto userDto)
        {
            var user = _mapper.Map<User>(userDto);
            user.Password = BCrypt.Net.BCrypt.HashPassword(userDto.Password);
            _repository.User.CreateUser(user);
            await _repository.SaveAsync();
            return _mapper.Map<UserDto>(user);
        }

        public async Task<IEnumerable<UserDto>> GetByIdsAsync(IEnumerable<int> ids)
        {
            if (ids is null)
                throw new IdParametersBadRequestException();
            var users = await _repository.User.GetByIdsAsync(ids, trackChanges: false);
            if (ids.Count() != users.Count())
                throw new CollectionByIdsBadRequestException();
            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public async Task<(IEnumerable<UserDto> users, string ids)> CreateUserCollectionAsync(IEnumerable<UserForCreationDto> userCollection)
        {
            if (userCollection is null)
                throw new UserCollectionBadRequestException();
            var userEntities = _mapper.Map<IEnumerable<User>>(userCollection);
            foreach (var user in userEntities)
            {
                user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);
                _repository.User.CreateUser(user);
            }
            await _repository.SaveAsync();
            var usersToReturn = _mapper.Map<IEnumerable<UserDto>>(userEntities);
            var ids = string.Join(",", usersToReturn.Select(u => u.Id));
            return (users: usersToReturn, ids: ids);
        }

        public async Task DeleteAsync(int id)
        {
            var user = await _repository.User.GetUserAsync(id, trackChanges: false);
            if (user is null)
                throw new UserNotFoundException(id);
            _repository.User.DeleteUser(user);
            await _repository.SaveAsync();
        }

        public async Task UpdateAsync(int id, UserForUpdateDto userDto)
        {
            var user = await _repository.User.GetUserAsync(id, trackChanges: true);
            if (user is null)
                throw new UserNotFoundException(id);
            _mapper.Map(userDto, user);
            user.Password = BCrypt.Net.BCrypt.HashPassword(userDto.Password);
            await _repository.SaveAsync();
        }

        public async Task<(UserForUpdateDto userToPatch, User userEntity)> GetUserForPatchAsync(int id, bool trackChanges)
        {
            var user = await _repository.User.GetUserAsync(id, trackChanges);
            if (user is null)
                throw new UserNotFoundException(id);
            var userToPatch = _mapper.Map<UserForUpdateDto>(user);
            return (userToPatch, user);
        }

        public async Task SaveChangesForPatchAsync(UserForUpdateDto userToPatch, User userEntity)
        {
            _mapper.Map(userToPatch, userEntity);
            await _repository.SaveAsync();
        }
    }
}