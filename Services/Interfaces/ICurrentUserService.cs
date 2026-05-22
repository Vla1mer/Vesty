using Entities.Models;

namespace Services.Interfaces
{
    public interface ICurrentUserService
    {
        int UserId { get; }
        string? UserName { get; }

        Task<ChatMember?> GetMembershipAsync(int chatId);
    }
}
