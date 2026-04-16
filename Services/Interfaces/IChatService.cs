using Entities.Models;
using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IChatService
    {
        Task<IEnumerable<ChatDto>> GetAllAsync();
        Task<ChatDto> GetByIdAsync(int id);
        Task<ChatDto> CreateAsync(ChatForCreationDto chatDto);
        Task DeleteAsync(int id);
        Task UpdateAsync(int id, ChatForUpdateDto chatDto);
    }
}