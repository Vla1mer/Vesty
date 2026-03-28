using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Entities.Models;

namespace Contracts
{
    public interface IChatRepository
    {
        Task<IEnumerable<Chat>> GetAllChatsAsync(bool trackChanges);
        Task<Chat?> GetChatAsync(int id, bool trackChanges);
        void CreateChat(Chat chat);
        void DeleteChat(Chat chat);
        void UpdateChat(Chat chat);
    }
}