using AutoMapper;
using Entities.Models;
using Services.DataTransferObjects;

namespace Vesty.Mappings
{
    public class MessageProfile : Profile
    {
        public MessageProfile()
        {
            CreateMap<Message, MessageDto>();
            CreateMap<MessageForCreationDto, Message>();
            CreateMap<MessageForUpdateDto, Message>();
        }
    }
}