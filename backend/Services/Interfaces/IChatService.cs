using Entities.Models;
using Shared.RequestFeatures;
using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IChatService
    {
        Task<(IEnumerable<ChatDto> chats, MetaData metaData)> GetAllAsync(ChatParameters chatParameters);
        Task<ChatDto> GetByIdAsync(int id);
        Task<ChatDto> CreateAsync(ChatForCreationDto chatDto);
        Task<ChatDto> CreateDirectChatAsync(int otherUserId);
        Task DeleteAsync(int id);
        Task UpdateAsync(int id, ChatForUpdateDto chatDto);
    }
}
