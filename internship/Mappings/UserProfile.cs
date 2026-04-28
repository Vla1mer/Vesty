using AutoMapper;
using Entities.Models;
using Services.DataTransferObjects;

namespace ChatApp.Mappings
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
            CreateMap<User, UserDto>();
            CreateMap<UserForCreationDto, User>();
            CreateMap<UserForUpdateDto, User>();
            CreateMap<UserForUpdateDto, User>().ReverseMap();
            CreateMap<UserForRegistrationDto, User>();
        }
    }
}