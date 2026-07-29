using Shared.RequestFeatures;
using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IMessageService
    {
        Task<(IEnumerable<MessageDto> messages, MetaData metaData)> GetAllAsync(MessageParameters messageParameters);
        Task<IEnumerable<MessageDto>> GetMessagesByChatAsync(int chatId, bool trackChanges);
        Task<MessageDto> GetByIdAsync(int id);
        Task<MessageDto> CreateMessageForChatAsync(int chatId, string content, int? replyToMessageId = null, IEnumerable<int>? attachmentIds = null);
        Task<MessageDto> CreateDirectChatAndSendMessageAsync(int otherUserId, string content);
        Task DeleteAsync(int id);
        Task UpdateMessageForChatAsync(int chatId, int id, string content);
        Task SetPinnedAsync(int messageId, bool pinned);
    }
}
