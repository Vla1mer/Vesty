using Entities.Models;
using Shared.RequestFeatures;
using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IMessageService
    {
        Task<(IEnumerable<MessageDto> messages, MetaData metaData)> GetAllAsync(MessageParameters messageParameters);
        Task<IEnumerable<MessageDto>> GetMessagesByChatAsync(int chatId, bool trackChanges);
        Task<MessageDto> GetByIdAsync(int id);
        Task<MessageDto> CreateMessageForChatAsync(int chatId, MessageForCreationDto message);
        Task<SentDirectMessageDto> SendDirectMessageAsync(SendDirectMessageDto dto);
        Task DeleteAsync(int id);
        Task UpdateMessageForChatAsync(int chatId, int id, MessageForUpdateDto messageDto);
    }
}
