using System.Linq.Dynamic.Core;
using Entities.Models;
using Repository.Extensions.Utility;

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
            bool? hasPhone) =>
            hasPhone switch
            {
                true => users.Where(u => u.Phone != null),
                false => users.Where(u => u.Phone == null),
                null => users
            };

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

        public static IQueryable<User> Sort(this IQueryable<User> users, string? orderByQueryString)
        {
            if (string.IsNullOrWhiteSpace(orderByQueryString))
                return users.OrderBy(u => u.Login);

            var orderQuery = OrderQueryBuilder.CreateOrderQuery<User>(orderByQueryString);

            if (string.IsNullOrWhiteSpace(orderQuery))
                return users.OrderBy(u => u.Login);

            return users.OrderBy(orderQuery);
        }
    }
}