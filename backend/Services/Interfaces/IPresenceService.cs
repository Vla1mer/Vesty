using Services.DataTransferObjects;

namespace Services.Interfaces
{
    public interface IPresenceService
    {
        Task RecordLastSeenAsync(int userId);
        Task<IEnumerable<UserPresenceDto>> GetPresenceAsync(IEnumerable<int> userIds);
        Task AnnouncePresenceAsync(int userId, bool isOnline);
    }
}
