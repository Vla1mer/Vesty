using Entities.Models;
using Shared.RequestFeatures;
using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IMessageService
    {
        Task<(IEnumerable<MessageDto> messages, MetaData metaData)> GetAllAsync(int currentUserId, MessageParameters messageParameters);
        Task<IEnumerable<MessageDto>> GetMessagesByChatAsync(int chatId, int currentUserId, bool trackChanges);
        Task<MessageDto> GetByIdAsync(int id, int currentUserId);
        Task<MessageDto> CreateMessageForChatAsync(int chatId, int currentUserId, MessageForCreationDto message);
        Task DeleteAsync(int id, int currentUserId);
        Task UpdateMessageForChatAsync(int chatId, int id, int currentUserId, MessageForUpdateDto messageDto);
    }
}
