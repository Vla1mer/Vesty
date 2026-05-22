using System.Linq.Dynamic.Core;
using Entities.Models;
using Repository.Extensions.Utility;

namespace Repository.Extensions
{
    public static class ChatRepositoryExtensions
    {
        public static IQueryable<Chat> FilterByChatIds(
            this IQueryable<Chat> chats,
            IEnumerable<int> chatIds) =>
            chats.Where(c => chatIds.Contains(c.Id));

        public static IQueryable<Chat> FilterByCreator(
            this IQueryable<Chat> chats,
            int? creatorId)
        {
            if (creatorId is null)
                return chats;

            return chats.Where(c => c.CreatorId == creatorId);
        }

        public static IQueryable<Chat> Search(
            this IQueryable<Chat> chats,
            string? searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return chats;

            var lowerCaseTerm = searchTerm.Trim().ToLower();

            return chats.Where(c => c.Name != null && c.Name.ToLower().Contains(lowerCaseTerm));
        }

        public static IQueryable<Chat> Sort(this IQueryable<Chat> chats, string? orderByQueryString)
        {
            if (string.IsNullOrWhiteSpace(orderByQueryString))
                return chats.OrderBy(c => c.Name);

            var orderQuery = OrderQueryBuilder.CreateOrderQuery<Chat>(orderByQueryString);

            if (string.IsNullOrWhiteSpace(orderQuery))
                return chats.OrderBy(c => c.Name);

            return chats.OrderBy(orderQuery);
        }
    }
}
