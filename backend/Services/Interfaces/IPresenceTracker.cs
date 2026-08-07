namespace Services.Interfaces
{
    public interface IPresenceTracker
    {
        bool Connect(int userId);
        bool Disconnect(int userId);
        bool IsOnline(int userId);
        IReadOnlySet<int> OnlineAmong(IEnumerable<int> userIds);
    }
}
