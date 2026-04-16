using Entities.Models;
using Entities.RequestFeatures;
using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IUserService
    {
        Task<(IEnumerable<UserDto> users, MetaData metaData)> GetAllAsync(UserParameters userParameters);
        Task<UserDto> GetByIdAsync(int id);
        Task<UserDto> CreateAsync(UserForCreationDto userDto);
        Task<IEnumerable<UserDto>> GetByIdsAsync(IEnumerable<int> ids);
        Task<(IEnumerable<UserDto> users, string ids)> CreateUserCollectionAsync(IEnumerable<UserForCreationDto> userCollection);
        Task DeleteAsync(int id);
        Task UpdateAsync(int id, UserForUpdateDto userDto);
        Task<(UserForUpdateDto userToPatch, User userEntity)> GetUserForPatchAsync(int id, bool trackChanges);
        Task SaveChangesForPatchAsync(UserForUpdateDto userToPatch, User userEntity);
    }
}