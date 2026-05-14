using Entities.Models;
using Shared.RequestFeatures;
using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IChatService
    {
        Task<(IEnumerable<ChatDto> chats, MetaData metaData)> GetAllAsync(ChatParameters chatParameters);
        Task<ChatDto> GetByIdAsync(int id);
        Task<ChatDto> CreateAsync(int currentUserId, ChatForCreationDto chatDto);
        Task<ChatDto> CreateDirectChatAsync(int currentUserId, int otherUserId);
        Task DeleteAsync(int id, int currentUserId);
        Task UpdateAsync(int id, int currentUserId, ChatForUpdateDto chatDto);
    }
}
