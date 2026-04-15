using AutoMapper;
using Entities.Models;
using Services.DataTransferObjects;

namespace ChatApp.Mappings
{
    public class ChatMemberProfile : Profile
    {
        public ChatMemberProfile()
        {
            CreateMap<ChatMember, ChatMemberDto>();
            CreateMap<ChatMemberForCreationDto, ChatMember>();
        }
    }
}