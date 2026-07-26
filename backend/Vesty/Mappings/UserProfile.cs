using AutoMapper;
using Entities.Models;
using Services.DataTransferObjects;

namespace Vesty.Mappings
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
            CreateMap<User, UserDto>();
            CreateMap<UserForUpdateDto, User>();
            CreateMap<UserForUpdateDto, User>().ReverseMap();
            CreateMap<UserForRegistrationDto, User>();
        }
    }
}