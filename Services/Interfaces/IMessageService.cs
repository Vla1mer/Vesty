using Entities.Models;
using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IMessageService
    {
        IEnumerable<MessageDto> GetAll();
        IEnumerable<MessageDto> GetMessagesByChat(int chatId, bool trackChanges);
        MessageDto GetById(int id);
        MessageDto Create(MessageForCreationDto messageDto);
        MessageDto CreateMessageForChat(int chatId, MessageForCreationDto message);
    }
}