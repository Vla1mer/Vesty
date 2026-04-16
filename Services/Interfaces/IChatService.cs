using Entities.Models;
using Entities.RequestFeatures;
using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IChatService
    {
        Task<IEnumerable<ChatDto>> GetAllAsync(ChatParameters chatParameters);
        Task<ChatDto> GetByIdAsync(int id);
        Task<ChatDto> CreateAsync(ChatForCreationDto chatDto);
        Task DeleteAsync(int id);
        Task UpdateAsync(int id, ChatForUpdateDto chatDto);
    }
}