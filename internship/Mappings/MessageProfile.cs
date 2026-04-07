using AutoMapper;
using Entities.Models;
using Services.DataTransferObjects;

namespace ChatApp.Mappings
{
    public class MessageProfile : Profile
    {
        public MessageProfile()
        {
            CreateMap<Message, MessageDto>();
            CreateMap<MessageForCreationDto, Message>();
        }
    }
}