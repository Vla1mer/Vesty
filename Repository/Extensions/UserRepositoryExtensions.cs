using Entities.Models;

namespace Repository.Extensions
{
    public static class UserRepositoryExtensions
    {
        public static IQueryable<User> FilterByBirthday(
            this IQueryable<User> users,
            DateOnly minBirthday,
            DateOnly maxBirthday) =>
            users.Where(u => u.Birthday >= minBirthday &&
                             u.Birthday <= maxBirthday);

        public static IQueryable<User> FilterByPhone(
            this IQueryable<User> users,
            bool? hasPhone)
        {
            if (hasPhone is null)
                return users;

            return hasPhone.Value
                ? users.Where(u => u.Phone != null)
                : users.Where(u => u.Phone == null);
        }

        public static IQueryable<User> Search(
    this IQueryable<User> users,
    string? searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return users;

            var lowerCaseTerm = searchTerm.Trim().ToLower();

            return users.Where(u =>
                u.Login.ToLower().Contains(lowerCaseTerm) ||
                (u.Name != null && u.Name.ToLower().Contains(lowerCaseTerm)) ||
                (u.Surname != null && u.Surname.ToLower().Contains(lowerCaseTerm)));
        }
    }
}