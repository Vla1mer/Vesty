namespace Entities.Models
{
    public static class ChatPermission
    {
        public const int Owner = 1;
        public const int Admins = 2;
        public const int Members = 3;

        public static bool IsDefined(int value) =>
            value is Owner or Admins or Members;

        public static bool Allows(int permission, int roleId) => permission switch
        {
            Owner => roleId == UserRole.Owner,
            Admins => roleId is UserRole.Owner or UserRole.Admin,
            Members => true,
            _ => false
        };
    }
}
