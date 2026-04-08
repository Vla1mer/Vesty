using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IUserService
    {
        IEnumerable<UserDto> GetAll();
        UserDto GetById(int id);
        UserDto Create(UserForCreationDto userDto);
        IEnumerable<UserDto> GetByIds(IEnumerable<int> ids);
        (IEnumerable<UserDto> users, string ids) CreateUserCollection(IEnumerable<UserForCreationDto> userCollection);
    }
}