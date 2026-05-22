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
                .ForMember(c => c.ChatMembers, opt => opt.Ignore())
                .ForMember(c => c.CreatorId, opt => opt.Ignore());
            CreateMap<ChatForUpdateDto, Chat>();
        }
    }
}
