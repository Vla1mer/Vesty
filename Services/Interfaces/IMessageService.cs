using Entities.Models;
using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IMessageService
    {
        Task<IEnumerable<MessageDto>> GetAllAsync();
        Task<IEnumerable<MessageDto>> GetMessagesByChatAsync(int chatId, bool trackChanges);
        Task<MessageDto> GetByIdAsync(int id);
        Task<MessageDto> CreateMessageForChatAsync(int chatId, MessageForCreationDto message);
        Task DeleteAsync(int id);
        Task UpdateMessageForChatAsync(int chatId, int id, MessageForUpdateDto messageDto);
    }
}