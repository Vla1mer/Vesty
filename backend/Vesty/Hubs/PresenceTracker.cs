using System.Collections.Concurrent;
using Services.Interfaces;

namespace Vesty.Hubs
{
    public sealed class PresenceTracker : IPresenceTracker
    {
        private readonly ConcurrentDictionary<int, int> _connections = new();

        public bool Connect(int userId) =>
            _connections.AddOrUpdate(userId, 1, (_, open) => open + 1) == 1;

        public bool Disconnect(int userId)
        {
            while (true)
            {
                if (!_connections.TryGetValue(userId, out var open))
                    return false;

                if (open <= 1)
                {
                    if (_connections.TryRemove(new KeyValuePair<int, int>(userId, open)))
                        return true;
                }
                else if (_connections.TryUpdate(userId, open - 1, open))
                {
                    return false;
                }
            }
        }

        public bool IsOnline(int userId) =>
            _connections.TryGetValue(userId, out var open) && open > 0;

        public IReadOnlySet<int> OnlineAmong(IEnumerable<int> userIds) =>
            userIds.Where(IsOnline).ToHashSet();
    }
}
