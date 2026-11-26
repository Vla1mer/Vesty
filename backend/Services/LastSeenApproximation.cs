namespace Services
{
    public static class LastSeenApproximation
    {
        public const string Recently = "recently";
        public const string WithinWeek = "week";
        public const string WithinMonth = "month";
        public const string LongAgo = "longAgo";

        public static string Of(bool isOnline, DateTime? lastSeenAt, DateTime now)
        {
            if (isOnline)
                return Recently;
            if (lastSeenAt is null)
                return LongAgo;

            var since = now - lastSeenAt.Value;
            if (since <= TimeSpan.FromDays(3))
                return Recently;
            if (since <= TimeSpan.FromDays(7))
                return WithinWeek;
            if (since <= TimeSpan.FromDays(30))
                return WithinMonth;
            return LongAgo;
        }
    }
}
