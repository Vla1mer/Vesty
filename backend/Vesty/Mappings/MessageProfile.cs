using AutoMapper;
using Entities.Models;
using Services.DataTransferObjects;

namespace Vesty.Mappings
{
    public class MessageProfile : Profile
    {
        public MessageProfile()
        {
            CreateMap<Message, MessageDto>()
                .ForMember(d => d.Reactions, opt => opt.Ignore())
                .ForMember(d => d.Attachments, opt => opt.Ignore())
                .ForMember(d => d.ReplyTo, opt => opt.Ignore());
            CreateMap<MessageForCreationDto, Message>();
            CreateMap<MessageForUpdateDto, Message>();
        }
    }
}