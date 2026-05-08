using System.Linq.Dynamic.Core;
using Entities.Models;
using Repository.Extensions.Utility;

namespace Repository.Extensions
{
    public static class MessageRepositoryExtensions
    {
        public static IQueryable<Message> FilterByCreatedAt(
            this IQueryable<Message> messages,
            DateTime minCreatedAt,
            DateTime maxCreatedAt) =>
            messages.Where(m => m.CreatedAt >= minCreatedAt &&
                                m.CreatedAt <= maxCreatedAt);

        public static IQueryable<Message> FilterByChatId(
            this IQueryable<Message> messages,
            int? chatId)
        {
            if (chatId is null)
                return messages;

            return messages.Where(m => m.ChatId == chatId);
        }

        public static IQueryable<Message> FilterByUserId(
            this IQueryable<Message> messages,
            int? userId)
        {
            if (userId is null)
                return messages;

            return messages.Where(m => m.UserId == userId);
        }

        public static IQueryable<Message> Search(
            this IQueryable<Message> messages,
            string? searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return messages;

            var lowerCaseTerm = searchTerm.Trim().ToLower();

            return messages.Where(m => m.Content.ToLower().Contains(lowerCaseTerm));
        }

        public static IQueryable<Message> Sort(this IQueryable<Message> messages, string? orderByQueryString)
        {
            if (string.IsNullOrWhiteSpace(orderByQueryString))
                return messages.OrderBy(m => m.CreatedAt);

            var orderQuery = OrderQueryBuilder.CreateOrderQuery<Message>(orderByQueryString);

            if (string.IsNullOrWhiteSpace(orderQuery))
                return messages.OrderBy(m => m.CreatedAt);

            return messages.OrderBy(orderQuery);
        }
    }
}