namespace Entities.Models
{
    public static class PrivacyLevel
    {
        public const int Everyone = 1;
        public const int FriendsOnly = 2;
        public const int Nobody = 3;

        public static bool IsDefined(int value) =>
            value is Everyone or FriendsOnly or Nobody;
    }
}
