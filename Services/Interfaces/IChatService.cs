using Entities.Models;

namespace Services.Interfaces
{
    public interface IChatService
    {
        IEnumerable<Chat> GetAll();
    }
}