using Entities.Models;

namespace Services.Interfaces
{
    public interface IMessageService
    {
        IEnumerable<Message> GetAll();
    }
}