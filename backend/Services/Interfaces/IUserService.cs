using Entities.Models;
using Microsoft.AspNetCore.Identity;
using Shared.RequestFeatures;
using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IUserService
    {
        Task<(IEnumerable<UserDto> users, MetaData metaData)> GetAllAsync(UserParameters userParameters);
        Task<UserDto> GetByIdAsync(int id);
        Task<IEnumerable<UserDto>> GetByIdsAsync(IEnumerable<int> ids);
        Task<(IEnumerable<UserDto> users, string ids)> RegisterUserCollectionAsync(IEnumerable<UserForRegistrationDto> userCollection);
        Task DeleteAsync(int id);
        Task UpdateAsync(int id, UserForUpdateDto userDto);
        Task<PrivacySettingsDto> GetPrivacyAsync();
        Task<PrivacySettingsDto> UpdatePrivacyAsync(PrivacySettingsDto settings);
        Task<(UserForUpdateDto userToPatch, User userEntity)> GetUserForPatchAsync(int id, bool trackChanges);
        Task SaveChangesForPatchAsync(UserForUpdateDto userToPatch, User userEntity);
        Task<IdentityResult> RegisterUser(UserForRegistrationDto userForRegistration);
        Task<bool> ValidateUser(UserForAuthenticationDto userForAuth);
        Task<TokenDto> CreateToken(bool populateExp);
        Task<TokenDto> RefreshToken(TokenDto tokenDto);
    }
}