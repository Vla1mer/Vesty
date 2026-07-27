using AutoMapper;
using Entities.Models;
using Services.DataTransferObjects;

namespace Vesty.Mappings
{
    public class ChatMemberProfile : Profile
    {
        public ChatMemberProfile()
        {
            CreateMap<ChatMember, ChatMemberDto>();
            CreateMap<ChatMemberForCreationDto, ChatMember>();
            CreateMap<ChatMember, ChatMemberWithRoleDto>()
                .ForMember(d => d.UserName, opt => opt.MapFrom(s => s.User.UserName))
                .ForMember(d => d.Name, opt => opt.MapFrom(s => s.User.Name))
                .ForMember(d => d.Surname, opt => opt.MapFrom(s => s.User.Surname))
                .ForMember(d => d.AvatarUpdatedAt, opt => opt.MapFrom(s => s.User.AvatarUpdatedAt));
        }
    }
}