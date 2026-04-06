using Entities.Models;
using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IChatService
    {
        IEnumerable<ChatDto> GetAll();
        ChatDto GetById(int id);
    }
}