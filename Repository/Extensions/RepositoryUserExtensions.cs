using Entities.Models;

namespace Repository
{
    public static class UserRepositoryExtensions
    {
        public static IQueryable<User> FilterByBirthday(
            this IQueryable<User> users,
            DateOnly minBirthday,
            DateOnly maxBirthday) =>
            users.Where(u => u.Birthday >= minBirthday &&
                             u.Birthday <= maxBirthday);

        public static IQueryable<User> Search(
            this IQueryable<User> users,
            string? searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return users;

            var lowerCaseTerm = searchTerm.Trim().ToLower();

            return users.Where(u => u.Login.ToLower().Contains(lowerCaseTerm));
        }
    }
}