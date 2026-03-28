using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Entities.Models;

namespace Contracts
{
    public interface IMessageRepository
    {
        Task<IEnumerable<Message>> GetAllMessagesAsync(bool trackChanges);
        Task<Message?> GetMessageAsync(int id, bool trackChanges);
        void CreateMessage(Message message);
        void DeleteMessage(Message message);
    }
}