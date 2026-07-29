using Entities.Models;
using Services.DataTransferObjects;

namespace Services
{
    internal static class ReactionMapper
    {
        public static IEnumerable<MessageReactionDto> Group(IEnumerable<MessageReaction> reactions) =>
            reactions
                .GroupBy(r => r.Emoji)
                .Select(g => new MessageReactionDto
                {
                    Emoji = g.Key,
                    UserIds = g.Select(r => r.UserId).ToList()
                })
                .ToList();
    }
}
