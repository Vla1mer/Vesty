using AutoMapper;
using Entities.Models;
using Services.DataTransferObjects;

namespace Chat.Mappings
{
    public class MessageProfile : Profile
    {
        public MessageProfile()
        {
            CreateMap<Message, MessageDto>();
        }
    }
}