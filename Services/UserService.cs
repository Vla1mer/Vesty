using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using Shared.Exceptions;
using Entities.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Shared.RequestFeatures;
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
        private readonly UserManager<User> _userManager;
        private readonly IConfiguration _configuration;

        private User? _user;

        public UserService(IRepositoryManager repository, ILoggerManager logger, IMapper mapper,
            UserManager<User> userManager, IConfiguration configuration)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
            _userManager = userManager;
            _configuration = configuration;
        }

        public async Task<(IEnumerable<UserDto> users, MetaData metaData)> GetAllAsync(UserParameters userParameters)
        {
            if (!userParameters.ValidBirthdayRange)
                throw new MaxBirthdayRangeBadRequestException();

            var usersWithMetaData = await _repository.User.GetAllUsersAsync(userParameters, trackChanges: false);
            var usersDto = _mapper.Map<IEnumerable<UserDto>>(usersWithMetaData);
            return (users: usersDto, metaData: usersWithMetaData.MetaData);
        }

        public async Task<UserDto> GetByIdAsync(int id)
        {
            var user = await _repository.User.GetUserAsync(id, trackChanges: false);
            if (user is null)
                throw new UserNotFoundException(id);
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

        public async Task<(IEnumerable<UserDto> users, string ids)> RegisterUserCollectionAsync(IEnumerable<UserForRegistrationDto> userCollection)
        {
            if (userCollection is null)
                throw new UserCollectionBadRequestException();

            var createdUsers = new List<User>();
            foreach (var userDto in userCollection)
            {
                var user = _mapper.Map<User>(userDto);
                var result = await _userManager.CreateAsync(user, userDto.Password!);
                if (result.Succeeded)
                {
                    if (userDto.Roles is not null)
                        await _userManager.AddToRolesAsync(user, userDto.Roles);
                    createdUsers.Add(user);
                }
            }

            var usersToReturn = _mapper.Map<IEnumerable<UserDto>>(createdUsers);
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

        public async Task<IdentityResult> RegisterUser(UserForRegistrationDto userForRegistration)
        {
            var user = _mapper.Map<User>(userForRegistration);

            var result = await _userManager.CreateAsync(user, userForRegistration.Password!);

            if (result.Succeeded && userForRegistration.Roles is not null)
                await _userManager.AddToRolesAsync(user, userForRegistration.Roles);

            return result;
        }

        public async Task<bool> ValidateUser(UserForAuthenticationDto userForAuth)
        {
            _user = await _userManager.FindByNameAsync(userForAuth.UserName!);

            var result = (_user != null && await _userManager.CheckPasswordAsync(_user, userForAuth.Password!));
            if (!result)
                _logger.LogWarn($"{nameof(ValidateUser)}: Authentication failed. Wrong user name or password.");

            return result;
        }

        public async Task<string> CreateToken()
        {
            var signingCredentials = GetSigningCredentials();
            var claims = await GetClaims();
            var tokenOptions = GenerateTokenOptions(signingCredentials, claims);

            return new JwtSecurityTokenHandler().WriteToken(tokenOptions);
        }

        private SigningCredentials GetSigningCredentials()
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.UTF8.GetBytes(jwtSettings["secretKey"]!);
            var secret = new SymmetricSecurityKey(key);

            return new SigningCredentials(secret, SecurityAlgorithms.HmacSha256);
        }

        private async Task<List<Claim>> GetClaims()
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, _user!.UserName!)
            };

            var roles = await _userManager.GetRolesAsync(_user);
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            return claims;
        }

        private JwtSecurityToken GenerateTokenOptions(SigningCredentials signingCredentials, List<Claim> claims)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");

            var tokenOptions = new JwtSecurityToken(
                issuer: jwtSettings["validIssuer"],
                audience: jwtSettings["validAudience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(Convert.ToDouble(jwtSettings["expires"])),
                signingCredentials: signingCredentials
            );

            return tokenOptions;
        }
    }
}