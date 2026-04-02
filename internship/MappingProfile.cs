using AutoMapper;
using Services.DataTransferObjects;
using Entities.Models;

namespace Chat
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<User, UserDto>();
            CreateMap<Entities.Models.Chat, ChatDto>();
            CreateMap<ChatMember, ChatMemberDto>();
            CreateMap<Message, MessageDto>();
        }
    }
}