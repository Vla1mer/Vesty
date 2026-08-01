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
        Task<DirectChatDto> CreateDirectChatAsync(int otherUserId);
        Task<int?> FindDirectChatIdAsync(int otherUserId);
        Task DeleteAsync(int id);
        Task ClearForCurrentUserAsync(int id);
        Task RenameAsync(int id, ChatForRenameDto chatDto);
        Task UpdatePermissionsAsync(int id, ChatPermissionsDto permissions);
        Task MarkReadAsync(int id);
    }
}
