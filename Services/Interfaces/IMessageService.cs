using Entities.Models;
using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IMessageService
    {
        IEnumerable<MessageDto> GetAll();
        IEnumerable<MessageDto> GetMessagesByChat(int chatId, bool trackChanges);
        MessageDto GetById(int id);
        MessageDto CreateMessageForChat(int chatId, MessageForCreationDto message);
        void Delete(int id);
        void UpdateMessageForChat(int chatId, int id, MessageForUpdateDto messageDto);
    }
}