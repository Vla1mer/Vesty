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
        private readonly ICurrentUserService _currentUser;

        private User? _user;

        public UserService(IRepositoryManager repository, ILoggerManager logger, IMapper mapper,
            UserManager<User> userManager, IConfiguration configuration, ICurrentUserService currentUser)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
            _userManager = userManager;
            _configuration = configuration;
            _currentUser = currentUser;
        }

        public async Task<(IEnumerable<UserDto> users, MetaData metaData)> GetAllAsync(UserParameters userParameters)
        {
            if (!userParameters.ValidBirthdayRange)
                throw new MaxBirthdayRangeBadRequestException();

            var blockedIds =
                (await _repository.UserBlock.GetRelatedUserIdsAsync(_currentUser.UserId)).ToList();
            userParameters.ExcludedUserIds = blockedIds;

            var usersWithMetaData = await _repository.User.GetAllUsersAsync(userParameters, trackChanges: false);
            var usersDto = await MaskProfilesAsync(usersWithMetaData, blockedIds);
            return (users: usersDto, metaData: usersWithMetaData.MetaData);
        }

        public async Task<UserDto> GetByIdAsync(int id)
        {
            var user = await _repository.User.GetUserAsync(id, trackChanges: false);
            if (user is null)
                throw new UserNotFoundException(id);

            return (await MaskProfilesAsync(new[] { user })).Single();
        }

        private async Task<List<UserDto>> MaskProfilesAsync(
            IReadOnlyCollection<User> users, IEnumerable<int>? knownBlockedIds = null)
        {
            var currentUserId = _currentUser.UserId;
            var others = users.Where(u => u.Id != currentUserId).ToList();

            var blocked = knownBlockedIds is not null
                ? knownBlockedIds.ToHashSet()
                : others.Count > 0
                    ? (await _repository.UserBlock.GetRelatedUserIdsAsync(currentUserId)).ToHashSet()
                    : new HashSet<int>();

            var friends = others.Any(u => u.WhoCanSeeProfile == PrivacyLevel.FriendsOnly)
                ? (await _repository.Friendship.GetFriendIdsAsync(currentUserId)).ToHashSet()
                : new HashSet<int>();

            return users.Select(user =>
            {
                var dto = _mapper.Map<UserDto>(user);
                if (user.Id == currentUserId)
                    return dto;

                var visible = !blocked.Contains(user.Id) &&
                    (user.WhoCanSeeProfile == PrivacyLevel.Everyone ||
                     (user.WhoCanSeeProfile == PrivacyLevel.FriendsOnly &&
                      friends.Contains(user.Id)));

                return visible
                    ? dto with { Phone = null }
                    : dto with { Phone = null, Name = null, Surname = null, IsProfileHidden = true };
            }).ToList();
        }

        public async Task<IEnumerable<UserDto>> GetByIdsAsync(IEnumerable<int> ids)
        {
            if (ids is null)
                throw new IdParametersBadRequestException();
            var users = await _repository.User.GetByIdsAsync(ids, trackChanges: false);
            if (ids.Count() != users.Count())
                throw new CollectionByIdsBadRequestException();
            return await MaskProfilesAsync(users.ToList());
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
                    createdUsers.Add(user);
                }
            }

            var usersToReturn = _mapper.Map<IEnumerable<UserDto>>(createdUsers);
            var ids = string.Join(",", usersToReturn.Select(u => u.Id));
            return (users: usersToReturn, ids: ids);
        }

        public async Task DeleteAsync(int id)
        {
            if (id != _currentUser.UserId)
                throw new UserSelfModificationException();
            var user = await _repository.User.GetUserAsync(id, trackChanges: false);
            if (user is null)
                throw new UserNotFoundException(id);
            _repository.User.DeleteUser(user);
            await _repository.SaveAsync();
        }

        public async Task<PrivacySettingsDto> GetPrivacyAsync()
        {
            var user = await _repository.User.GetUserAsync(_currentUser.UserId, trackChanges: false)
                ?? throw new UserNotFoundException(_currentUser.UserId);

            return new PrivacySettingsDto
            {
                WhoCanMessage = user.WhoCanMessage,
                WhoCanInvite = user.WhoCanInvite,
                WhoCanSeeProfile = user.WhoCanSeeProfile
            };
        }

        public async Task<PrivacySettingsDto> UpdatePrivacyAsync(PrivacySettingsDto settings)
        {
            if (!PrivacyLevel.IsDefined(settings.WhoCanMessage) ||
                !PrivacyLevel.IsDefined(settings.WhoCanInvite) ||
                !PrivacyLevel.IsDefined(settings.WhoCanSeeProfile))
                throw new InvalidPrivacyLevelException();

            var user = await _repository.User.GetUserAsync(_currentUser.UserId, trackChanges: true)
                ?? throw new UserNotFoundException(_currentUser.UserId);

            user.WhoCanMessage = settings.WhoCanMessage;
            user.WhoCanInvite = settings.WhoCanInvite;
            user.WhoCanSeeProfile = settings.WhoCanSeeProfile;
            await _repository.SaveAsync();

            return settings;
        }

        public async Task UpdateAsync(int id, UserForUpdateDto userDto)
        {
            if (id != _currentUser.UserId)
                throw new UserSelfModificationException();
            var user = await _repository.User.GetUserAsync(id, trackChanges: true);
            if (user is null)
                throw new UserNotFoundException(id);
            _mapper.Map(userDto, user);
            user.NormalizedUserName = userDto.UserName?.ToUpperInvariant();
            await _repository.SaveAsync();
        }

        public async Task<(UserForUpdateDto userToPatch, User userEntity)> GetUserForPatchAsync(int id, bool trackChanges)
        {
            if (id != _currentUser.UserId)
                throw new UserSelfModificationException();
            var user = await _repository.User.GetUserAsync(id, trackChanges);
            if (user is null)
                throw new UserNotFoundException(id);
            var userToPatch = _mapper.Map<UserForUpdateDto>(user);
            return (userToPatch, user);
        }

        public async Task SaveChangesForPatchAsync(UserForUpdateDto userToPatch, User userEntity)
        {
            _mapper.Map(userToPatch, userEntity);
            userEntity.NormalizedUserName = userToPatch.UserName?.ToUpperInvariant();
            await _repository.SaveAsync();
        }

        public async Task<IdentityResult> RegisterUser(UserForRegistrationDto userForRegistration)
        {
            var user = _mapper.Map<User>(userForRegistration);

            var result = await _userManager.CreateAsync(user, userForRegistration.Password!);

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

        public async Task<TokenDto> CreateToken(bool populateExp)
        {
            var signingCredentials = GetSigningCredentials();
            var claims = await GetClaims();
            var tokenOptions = GenerateTokenOptions(signingCredentials, claims);

            var refreshToken = GenerateRefreshToken();

            _user!.RefreshToken = HashRefreshToken(refreshToken);

            if (populateExp)
                _user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

            await _userManager.UpdateAsync(_user);

            var accessToken = new JwtSecurityTokenHandler().WriteToken(tokenOptions);

            return new TokenDto(accessToken, refreshToken);
        }

        public async Task<TokenDto> RefreshToken(TokenDto tokenDto)
        {
            var principal = GetPrincipalFromExpiredToken(tokenDto.AccessToken);

            var user = await _userManager.FindByNameAsync(principal.Identity!.Name!);
            if (user == null || user.RefreshToken != HashRefreshToken(tokenDto.RefreshToken) ||
                user.RefreshTokenExpiryTime <= DateTime.UtcNow)
                throw new RefreshTokenBadRequestException();

            _user = user;

            return await CreateToken(populateExp: false);
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private static string HashRefreshToken(string token)
        {
            var bytes = System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(bytes);
        }

        private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");

            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = true,
                ValidateIssuer = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtSettings["secretKey"]!)),
                ValidateLifetime = false,
                ValidIssuer = jwtSettings["validIssuer"],
                ValidAudience = jwtSettings["validAudience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);

            var jwtSecurityToken = securityToken as JwtSecurityToken;
            if (jwtSecurityToken == null || !jwtSecurityToken.Header.Alg
                .Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                throw new SecurityTokenException("Invalid token");
            }

            return principal;
        }

        private SigningCredentials GetSigningCredentials()
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.UTF8.GetBytes(jwtSettings["secretKey"]!);
            var secret = new SymmetricSecurityKey(key);

            return new SigningCredentials(secret, SecurityAlgorithms.HmacSha256);
        }

        private Task<List<Claim>> GetClaims()
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, _user!.UserName!),
                new Claim(ClaimTypes.NameIdentifier, _user.Id.ToString())
            };

            return Task.FromResult(claims);
        }

        private JwtSecurityToken GenerateTokenOptions(SigningCredentials signingCredentials, List<Claim> claims)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");

            var tokenOptions = new JwtSecurityToken(
                issuer: jwtSettings["validIssuer"],
                audience: jwtSettings["validAudience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(jwtSettings["expires"])),
                signingCredentials: signingCredentials
            );

            return tokenOptions;
        }
    }
}