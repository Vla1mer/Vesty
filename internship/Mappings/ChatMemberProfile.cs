using AutoMapper;
using Entities.Models;
using Services.DataTransferObjects;

namespace Chat.Mappings
{
    public class ChatMemberProfile : Profile
    {
        public ChatMemberProfile()
        {
            CreateMap<ChatMember, ChatMemberDto>();
        }
    }
}