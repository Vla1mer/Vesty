using Entities.Models;
using Repository.Interfaces;
using Services.DataTransferObjects;
using Services.Interfaces;
using Shared.Exceptions;

namespace Services
{
    public class ReactionService : IReactionService
    {
        private const int MaxEmojiLength = 16;

        private readonly IRepositoryManager _repository;
        private readonly ICurrentUserService _currentUser;
        private readonly IChatNotifier _notifier;

        public ReactionService(IRepositoryManager repository, ICurrentUserService currentUser,
            IChatNotifier notifier)
        {
            _repository = repository;
            _currentUser = currentUser;
            _notifier = notifier;
        }

        public async Task AddAsync(int messageId, string emoji)
        {
            var message = await GetMessageForReactingAsync(messageId, emoji);

            var existing = await _repository.Reaction.GetReactionAsync(
                messageId, _currentUser.UserId, emoji, trackChanges: false);

            if (existing is not null)
                return;

            _repository.Reaction.CreateReaction(new MessageReaction
            {
                MessageId = messageId,
                UserId = _currentUser.UserId,
                Emoji = emoji
            });

            try
            {
                await _repository.SaveAsync();
            }
            catch (DuplicateResourceException)
            {
            }

            await NotifyAsync(message.ChatId, messageId);
        }

        public async Task RemoveAsync(int messageId, string emoji)
        {
            var message = await GetMessageForReactingAsync(messageId, emoji);

            var existing = await _repository.Reaction.GetReactionAsync(
                messageId, _currentUser.UserId, emoji, trackChanges: true);

            if (existing is null)
                return;

            _repository.Reaction.DeleteReaction(existing);
            await _repository.SaveAsync();

            await NotifyAsync(message.ChatId, messageId);
        }

        private async Task<Message> GetMessageForReactingAsync(int messageId, string emoji)
        {
            if (string.IsNullOrWhiteSpace(emoji) || emoji.Length > MaxEmojiLength)
                throw new InvalidReactionException("emoji is required and must be short.");

            var message = await _repository.Message.GetMessageAsync(messageId, trackChanges: false);
            if (message is null)
                throw new MessageNotFoundException(messageId);

            var membership = await _currentUser.GetMembershipAsync(message.ChatId);
            if (membership is null)
                throw new ChatAccessDeniedException(message.ChatId, _currentUser.UserId);

            return message;
        }

        private async Task NotifyAsync(int chatId, int messageId)
        {
            var reactions = await _repository.Reaction.GetByMessageIdsAsync(new[] { messageId });
            var members = await _repository.ChatMember.GetMembersByChatIdAsync(chatId, trackChanges: false);

            await _notifier.MessageReactionsUpdatedAsync(
                members.Select(m => m.UserId),
                new MessageReactionsSignalrDto
                {
                    ChatId = chatId,
                    MessageId = messageId,
                    Reactions = ReactionMapper.Group(reactions)
                });
        }
    }
}
