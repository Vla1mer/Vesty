using Repository.Interfaces;
using Services.Cryptography;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace Services
{
    internal sealed class ChatEnricher
    {
        private readonly IRepositoryManager _repository;
        private readonly ICurrentUserService _currentUser;
        private readonly IMessageCipher _cipher;

        public ChatEnricher(IRepositoryManager repository, ICurrentUserService currentUser,
            IMessageCipher cipher)
        {
            _repository = repository;
            _currentUser = currentUser;
            _cipher = cipher;
        }

        public async Task<List<ChatDto>> EnrichListAsync(List<ChatDto> chats)
        {
            var result = await ConvertDirectChatsAsync(chats);
            result = await AttachLastMessagesAsync(result);
            result = await AttachUnreadCountsAsync(result);
            return await HideClearedDirectChatsAsync(result);
        }

        public async Task<List<ChatDto>> AttachUnreadCountsAsync(List<ChatDto> chats)
        {
            if (chats.Count == 0) return chats;

            var counts = await _repository.Message.GetUnreadCountsAsync(
                _currentUser.UserId, chats.Select(c => c.Id));

            return chats.Select(c =>
                counts.TryGetValue(c.Id, out var n) ? c with { UnreadCount = n } : c
            ).ToList();
        }

        private async Task<List<ChatDto>> ConvertDirectChatsAsync(List<ChatDto> chats)
        {
            var directChatIds = chats.Where(c => c.IsPrivate).Select(c => c.Id).ToList();
            if (directChatIds.Count == 0) return chats;

            var partners = await _repository.ChatMember.GetDirectChatPartnersAsync(
                directChatIds, _currentUser.UserId);

            var result = new List<ChatDto>(chats.Count);
            foreach (var chat in chats)
            {
                if (chat.IsPrivate)
                {
                    partners.TryGetValue(chat.Id, out var partner);
                    result.Add(ChatMapper.ToDirectChatDto(chat, partner));
                }
                else
                {
                    result.Add(chat);
                }
            }
            return result;
        }

        private async Task<List<ChatDto>> AttachLastMessagesAsync(List<ChatDto> chats)
        {
            if (chats.Count == 0) return chats;

            var lastMessages = await _repository.Message.GetLastMessagesByChatIdsAsync(
                chats.Select(c => c.Id), _currentUser.UserId);
            var lastByChat = lastMessages.ToDictionary(m => m.ChatId);

            return chats.Select(c =>
                lastByChat.TryGetValue(c.Id, out var lm)
                    ? c with
                    {
                        LastMessageContent = _cipher.Decrypt(lm.Content),
                        LastMessageSenderName = lm.User?.UserName,
                        LastMessageSenderId = lm.UserId,
                        LastMessageAt = lm.CreatedAt
                    }
                    : c
            ).ToList();
        }

        private async Task<List<ChatDto>> HideClearedDirectChatsAsync(List<ChatDto> chats)
        {
            if (chats.Count == 0) return chats;

            var cleared = await _repository.ChatMember.GetClearedAtByChatIdsAsync(
                _currentUser.UserId, chats.Select(c => c.Id));

            if (cleared.Count == 0) return chats;

            return chats.Where(c =>
                !c.IsPrivate ||
                !cleared.TryGetValue(c.Id, out var clearedAt) ||
                (c.LastMessageAt is not null && c.LastMessageAt > clearedAt)
            ).ToList();
        }
    }
}
