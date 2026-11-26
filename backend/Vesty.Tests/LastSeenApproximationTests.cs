using Services;

namespace Vesty.Tests
{
    public class LastSeenApproximationTests
    {
        private static readonly DateTime Now = new(2026, 11, 26, 12, 0, 0, DateTimeKind.Utc);

        [Fact]
        public void SomeoneOnlineNow_WasSeenRecently()
        {
            Assert.Equal(LastSeenApproximation.Recently,
                LastSeenApproximation.Of(isOnline: true, lastSeenAt: null, Now));
        }

        [Fact]
        public void SomeoneNeverSeen_WasSeenLongAgo()
        {
            Assert.Equal(LastSeenApproximation.LongAgo,
                LastSeenApproximation.Of(isOnline: false, lastSeenAt: null, Now));
        }

        [Theory]
        [InlineData(0.5, LastSeenApproximation.Recently)]
        [InlineData(3, LastSeenApproximation.Recently)]
        [InlineData(3.5, LastSeenApproximation.WithinWeek)]
        [InlineData(7, LastSeenApproximation.WithinWeek)]
        [InlineData(8, LastSeenApproximation.WithinMonth)]
        [InlineData(30, LastSeenApproximation.WithinMonth)]
        [InlineData(31, LastSeenApproximation.LongAgo)]
        public void TheTimeSinceLastSeen_PicksTheInterval(double daysAgo, string expected)
        {
            Assert.Equal(expected,
                LastSeenApproximation.Of(isOnline: false, Now.AddDays(-daysAgo), Now));
        }
    }
}
