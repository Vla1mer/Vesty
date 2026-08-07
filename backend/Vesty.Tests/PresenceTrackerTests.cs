using Services.Interfaces;
using Vesty.Hubs;

namespace Vesty.Tests
{
    public class PresenceTrackerTests
    {
        private const int UserId = 1;
        private const int OtherUserId = 2;

        private readonly IPresenceTracker _tracker = new PresenceTracker();

        [Fact]
        public void NobodyIsOnlineAtFirst()
        {
            Assert.False(_tracker.IsOnline(UserId));
        }

        [Fact]
        public void FirstConnection_BringsTheUserOnline()
        {
            Assert.True(_tracker.Connect(UserId));
            Assert.True(_tracker.IsOnline(UserId));
        }

        [Fact]
        public void SecondConnection_ChangesNothing()
        {
            _tracker.Connect(UserId);

            Assert.False(_tracker.Connect(UserId));
            Assert.True(_tracker.IsOnline(UserId));
        }

        [Fact]
        public void ClosingOneOfTwo_LeavesTheUserOnline()
        {
            _tracker.Connect(UserId);
            _tracker.Connect(UserId);

            Assert.False(_tracker.Disconnect(UserId));
            Assert.True(_tracker.IsOnline(UserId));
        }

        [Fact]
        public void ClosingTheLastOne_TakesTheUserOffline()
        {
            _tracker.Connect(UserId);
            _tracker.Connect(UserId);
            _tracker.Disconnect(UserId);

            Assert.True(_tracker.Disconnect(UserId));
            Assert.False(_tracker.IsOnline(UserId));
        }

        [Fact]
        public void ClosingWhatWasNeverOpen_ReportsNothing()
        {
            Assert.False(_tracker.Disconnect(UserId));
            Assert.False(_tracker.IsOnline(UserId));
        }

        [Fact]
        public void ClosingTwiceOver_DoesNotReportOfflineAgain()
        {
            _tracker.Connect(UserId);
            _tracker.Disconnect(UserId);

            Assert.False(_tracker.Disconnect(UserId));
        }

        [Fact]
        public void UsersDoNotShareTheirCounters()
        {
            _tracker.Connect(UserId);

            Assert.True(_tracker.IsOnline(UserId));
            Assert.False(_tracker.IsOnline(OtherUserId));
        }

        [Fact]
        public void ComingBackAfterLeaving_Works()
        {
            _tracker.Connect(UserId);
            _tracker.Disconnect(UserId);

            Assert.True(_tracker.Connect(UserId));
            Assert.True(_tracker.IsOnline(UserId));
        }

        [Fact]
        public void OnlineAmong_KeepsOnlyThoseWhoAre()
        {
            _tracker.Connect(UserId);

            var online = _tracker.OnlineAmong(new[] { UserId, OtherUserId, 3 });

            Assert.Equal(new HashSet<int> { UserId }, online);
        }

        [Fact]
        public void OnlineAmong_SurvivesAnEmptyList()
        {
            Assert.Empty(_tracker.OnlineAmong(Array.Empty<int>()));
        }

        [Fact]
        public async Task ManyConnectionsAtOnce_LeaveTheUserOnlineExactlyOnce()
        {
            var firsts = await Task.WhenAll(
                Enumerable.Range(0, 50).Select(_ => Task.Run(() => _tracker.Connect(UserId))));

            Assert.Single(firsts, first => first);
            Assert.True(_tracker.IsOnline(UserId));
        }

        [Fact]
        public async Task MoreDisconnectsThanConnections_StillReportOfflineOnce()
        {
            for (var i = 0; i < 10; i++)
                _tracker.Connect(UserId);

            var lasts = await Task.WhenAll(
                Enumerable.Range(0, 40).Select(_ => Task.Run(() => _tracker.Disconnect(UserId))));

            Assert.Single(lasts, last => last);
            Assert.False(_tracker.IsOnline(UserId));
        }

        [Fact]
        public async Task ManyDisconnectsAtOnce_TakeTheUserOfflineExactlyOnce()
        {
            for (var i = 0; i < 50; i++)
                _tracker.Connect(UserId);

            var lasts = await Task.WhenAll(
                Enumerable.Range(0, 50).Select(_ => Task.Run(() => _tracker.Disconnect(UserId))));

            Assert.Single(lasts, last => last);
            Assert.False(_tracker.IsOnline(UserId));
        }
    }
}
