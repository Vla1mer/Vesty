using AutoMapper;
using Entities.Models;
using Services.DataTransferObjects;

namespace ChatApp.Mappings
{
    public class ChatProfile : Profile
    {
        public ChatProfile()
        {
            CreateMap<Chat, ChatDto>();
            CreateMap<ChatForCreationDto, Chat>()
                .ForMember(c => c.ChatMembers,
                    opt => opt.MapFrom(src => src.Members));
            CreateMap<ChatForUpdateDto, Chat>();
        }
    }
}