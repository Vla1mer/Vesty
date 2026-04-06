using AutoMapper;
using Services.DataTransferObjects;

namespace Chat.Mappings
{
    public class ChatProfile : Profile
    {
        public ChatProfile()
        {
            CreateMap<Entities.Models.Chat, ChatDto>();
        }
    }
}