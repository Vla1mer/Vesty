using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Entities.Models;

namespace Contracts
{
    public interface IChatMemberRepository
    {
        Task<IEnumerable<ChatMember>> GetAllMembersAsync(bool trackChanges);
        Task<ChatMember?> GetMemberAsync(int chatId, int userId, bool trackChanges);
        void CreateMember(ChatMember member);
        void DeleteMember(ChatMember member);
    }
}