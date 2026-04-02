using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IUserService
    {
        IEnumerable<UserDto> GetAll();
        UserDto GetById(int id);
    }
}