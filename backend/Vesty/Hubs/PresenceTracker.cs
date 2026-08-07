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
            if (!_connections.ContainsKey(userId))
                return false;

            var open = _connections.AddOrUpdate(userId, 0, (_, current) => Math.Max(current - 1, 0));
            if (open > 0)
                return false;

            _connections.TryRemove(new KeyValuePair<int, int>(userId, 0));
            return true;
        }

        public bool IsOnline(int userId) =>
            _connections.TryGetValue(userId, out var open) && open > 0;

        public IReadOnlySet<int> OnlineAmong(IEnumerable<int> userIds) =>
            userIds.Where(IsOnline).ToHashSet();
    }
}
