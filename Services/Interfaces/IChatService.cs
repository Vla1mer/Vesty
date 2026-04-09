using Entities.Models;
using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IChatService
    {
        IEnumerable<ChatDto> GetAll();
        ChatDto GetById(int id);
        ChatDto Create(ChatForCreationDto chatDto);
        void Delete(int id);
        void Update(int id, ChatForUpdateDto chatDto);
    }
}