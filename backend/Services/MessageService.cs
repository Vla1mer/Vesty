using AutoMapper;
using Shared.Exceptions;
using Entities.Models;
using Shared.RequestFeatures;
using Repository.Interfaces;
using Services.Cryptography;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace Services
{
    public class MessageService : IMessageService
    {
        private readonly IRepositoryManager _repository;
        private readonly ILoggerManager _logger;
        private readonly IMapper _mapper;
        private readonly IMessageCipher _cipher;
        private readonly ICurrentUserService _currentUser;
        private readonly IChatService _chatService;
        private readonly IChatNotifier _notifier;
        private readonly IAttachmentService _attachments;

        public MessageService(IRepositoryManager repository, ILoggerManager logger, IMapper mapper,
            IMessageCipher cipher, ICurrentUserService currentUser, IChatService chatService,
            IChatNotifier notifier, IAttachmentService attachments)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
            _cipher = cipher;
            _currentUser = currentUser;
            _chatService = chatService;
            _notifier = notifier;
            _attachments = attachments;
        }

        public async Task<(IEnumerable<MessageDto> messages, MetaData metaData)> GetAllAsync(MessageParameters messageParameters)
        {
            if (!messageParameters.ValidCreatedAtRange)
                throw new MaxCreatedAtRangeBadRequestException();

            var messagesWithMetaData = await _repository.Message.GetAllMessagesAsync(
                messageParameters, _currentUser.UserId, trackChanges: false);
            DecryptInPlace(messagesWithMetaData);
            var messagesDto = _mapper.Map<IEnumerable<MessageDto>>(messagesWithMetaData);
            return (messages: messagesDto, metaData: messagesWithMetaData.MetaData);
        }

        public async Task<MessageDto> GetByIdAsync(int id)
        {
            var message = await GetMessageOrThrowAsync(id, trackChanges: false);
            var membership = await EnsureCallerIsChatMember(message.ChatId);
            if (IsCleared(message, membership))
                throw new MessageNotFoundException(id);
            message.Content = _cipher.Decrypt(message.Content);

            var replyTo = await GetReplyTargetOrThrowAsync(message.ChatId, message.ReplyToMessageId);
            var reactions = await _repository.Reaction.GetByMessageIdsAsync(new[] { message.Id });
            var attachments = await _repository.Attachment.GetByMessageIdsAsync(new[] { message.Id });

            return _mapper.Map<MessageDto>(message) with
            {
                ReplyTo = ToReplyDto(replyTo),
                Reactions = ReactionMapper.Group(reactions),
                Attachments = attachments.Select(AttachmentService.ToDto).ToList()
            };
        }

        public async Task<IEnumerable<MessageDto>> GetMessagesByChatAsync(int chatId, bool trackChanges)
        {
            await GetChatOrThrowAsync(chatId);
            var membership = await EnsureCallerIsChatMember(chatId);
            var messages = (await _repository.Message.GetMessagesByChatAsync(
                chatId, membership.ClearedAt, trackChanges)).ToList();
            DecryptInPlace(messages);

            var byId = messages.ToDictionary(m => m.Id);
            var reactions = await _repository.Reaction.GetByMessageIdsAsync(messages.Select(m => m.Id));
            var reactionsByMessage = reactions
                .GroupBy(r => r.MessageId)
                .ToDictionary(g => g.Key, g => ReactionMapper.Group(g));

            var attachments = await _repository.Attachment.GetByMessageIdsAsync(messages.Select(m => m.Id));
            var attachmentsByMessage = attachments
                .GroupBy(a => a.MessageId!.Value)
                .ToDictionary(g => g.Key, g => g.Select(AttachmentService.ToDto).ToList());

            return messages.Select(m => _mapper.Map<MessageDto>(m) with
            {
                ReplyTo = m.ReplyToMessageId is int replyId && byId.TryGetValue(replyId, out var target)
                    ? ToReplyDto(target)
                    : null,
                Reactions = reactionsByMessage.TryGetValue(m.Id, out var rs) ? rs : [],
                Attachments = attachmentsByMessage.TryGetValue(m.Id, out var att)
                    ? att
                    : Enumerable.Empty<MessageAttachmentDto>()
            });
        }

        public async Task<MessageDto> CreateMessageForChatAsync(int chatId, string? content,
            int? replyToMessageId = null, IEnumerable<int>? attachmentIds = null)
        {
            var chat = await GetChatOrThrowAsync(chatId);
            await EnsureCallerIsChatMember(chatId);
            await EnsureDirectChatNotBlockedAsync(chat);

            var text = content ?? string.Empty;
            if (string.IsNullOrWhiteSpace(text) && attachmentIds?.Any() != true)
                throw new EmptyMessageException();

            var replyTo = await GetReplyTargetOrThrowAsync(chatId, replyToMessageId);
            var attachments = await _attachments.ReserveAsync(attachmentIds ?? []);

            var message = new Message
            {
                UserId = _currentUser.UserId,
                Content = _cipher.Encrypt(text),
                ReplyToMessageId = replyTo?.Id
            };
            _repository.Message.CreateMessageForChat(chatId, message);
            await _repository.SaveAsync();

            if (attachments.Count > 0)
            {
                foreach (var attachment in attachments)
                    attachment.MessageId = message.Id;

                await _repository.SaveAsync();
            }

            var messageDto = _mapper.Map<MessageDto>(message) with
            {
                Content = text,
                UserName = _currentUser.UserName,
                ReplyTo = ToReplyDto(replyTo),
                Attachments = attachments.Select(AttachmentService.ToDto).ToList()
            };
            await _notifier.MessageReceivedAsync(await GetMemberIdsAsync(chatId), messageDto);
            return messageDto;
        }

        public async Task<MessageDto> CreateDirectChatAndSendMessageAsync(int otherUserId, string content)
        {
            var chat = await _chatService.CreateDirectChatAsync(otherUserId);
            return await CreateMessageForChatAsync(chat.Id, content);
        }

        public async Task DeleteAsync(int id)
        {
            var message = await GetMessageOrThrowAsync(id, trackChanges: false);
            await EnsureCallerCanModerateMessage(message);

            await _attachments.DeleteForMessageAsync(message.Id);

            _repository.Message.DeleteMessage(message);
            await _repository.SaveAsync();

            var deletedDto = new MessageDeletedSignalrDto { ChatId = message.ChatId, MessageId = id };
            await _notifier.MessageDeletedAsync(await GetMemberIdsAsync(message.ChatId), deletedDto);
        }

        public async Task UpdateMessageForChatAsync(int chatId, int id, string content)
        {
            await GetChatOrThrowAsync(chatId);
            await EnsureCallerIsChatMember(chatId);

            var message = await GetMessageOrThrowAsync(id, trackChanges: true);
            if (message.UserId != _currentUser.UserId)
                throw new MessageOwnershipException(id);
            message.Content = _cipher.Encrypt(content);
            message.IsEdited = true;
            await _repository.SaveAsync();
            message.Content = content;

            var replyTo = await GetReplyTargetOrThrowAsync(chatId, message.ReplyToMessageId);
            var reactions = await _repository.Reaction.GetByMessageIdsAsync(new[] { message.Id });
            var attachments = await _repository.Attachment.GetByMessageIdsAsync(new[] { message.Id });

            var messageDto = _mapper.Map<MessageDto>(message) with
            {
                Content = content,
                UserName = _currentUser.UserName,
                ReplyTo = ToReplyDto(replyTo),
                Reactions = ReactionMapper.Group(reactions),
                Attachments = attachments.Select(AttachmentService.ToDto).ToList()
            };
            await _notifier.MessageUpdatedAsync(await GetMemberIdsAsync(chatId), messageDto);
        }

        public async Task SetPinnedAsync(int messageId, bool pinned)
        {
            var message = await GetMessageOrThrowAsync(messageId, trackChanges: true);
            await EnsureCallerCanPinAsync(message.ChatId);

            message.PinnedAt = pinned ? DateTime.UtcNow : null;
            await _repository.SaveAsync();

            await _notifier.MessagePinnedAsync(
                await GetMemberIdsAsync(message.ChatId),
                new MessagePinnedSignalrDto
                {
                    ChatId = message.ChatId,
                    MessageId = message.Id,
                    PinnedAt = message.PinnedAt
                });
        }

        private async Task EnsureCallerCanPinAsync(int chatId)
        {
            var chat = await GetChatOrThrowAsync(chatId);
            var member = await _currentUser.GetMembershipAsync(chatId);
            if (member is null)
                throw new ChatAccessDeniedException(chatId, _currentUser.UserId);

            if (chat.IsPrivate)
                return;

            if (member.RoleId != UserRole.Owner && member.RoleId != UserRole.Admin)
                throw new InsufficientChatPermissionException("pin messages", chatId);
        }

        private const int ReplyPreviewLength = 120;

        private async Task<Message?> GetReplyTargetOrThrowAsync(int chatId, int? replyToMessageId)
        {
            if (replyToMessageId is null)
                return null;

            var target = await _repository.Message.GetMessageAsync(replyToMessageId.Value, trackChanges: false);
            if (target is null || target.ChatId != chatId)
                throw new MessageNotFoundException(replyToMessageId.Value);

            target.Content = _cipher.Decrypt(target.Content);
            return target;
        }

        private static MessageReplyDto? ToReplyDto(Message? message)
        {
            if (message is null)
                return null;

            var content = message.Content ?? string.Empty;
            return new MessageReplyDto
            {
                Id = message.Id,
                UserId = message.UserId,
                UserName = message.User?.UserName,
                Content = content.Length > ReplyPreviewLength
                    ? content[..ReplyPreviewLength]
                    : content
            };
        }

        private async Task<IEnumerable<int>> GetMemberIdsAsync(int chatId)
        {
            var members = await _repository.ChatMember.GetMembersByChatIdAsync(chatId, trackChanges: false);
            return members.Select(m => m.UserId);
        }

        private async Task EnsureDirectChatNotBlockedAsync(Chat chat)
        {
            if (!chat.IsPrivate) return;

            var members = await _repository.ChatMember.GetMembersByChatIdAsync(chat.Id, trackChanges: false);
            var partnerId = members.Select(m => m.UserId)
                .FirstOrDefault(id => id != _currentUser.UserId);
            if (partnerId == 0) return;

            if (await _repository.UserBlock.IsBlockedEitherWayAsync(_currentUser.UserId, partnerId))
                throw new BlockedUserException();
        }

        private async Task<Chat> GetChatOrThrowAsync(int chatId)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            return chat;
        }

        private async Task<Message> GetMessageOrThrowAsync(int id, bool trackChanges)
        {
            var message = await _repository.Message.GetMessageAsync(id, trackChanges);
            if (message is null)
                throw new MessageNotFoundException(id);
            return message;
        }

        private static bool IsCleared(Message message, ChatMember membership) =>
            membership.ClearedAt is not null && message.CreatedAt <= membership.ClearedAt;

        private async Task<ChatMember> EnsureCallerIsChatMember(int chatId)
        {
            var member = await _currentUser.GetMembershipAsync(chatId);
            if (member is null)
                throw new ChatAccessDeniedException(chatId, _currentUser.UserId);
            return member;
        }

        private async Task EnsureCallerCanModerateMessage(Message message)
        {
            if (message.UserId == _currentUser.UserId)
                return;

            var caller = await _currentUser.GetMembershipAsync(message.ChatId);
            var isModerator = caller is not null &&
                (caller.RoleId == UserRole.Owner || caller.RoleId == UserRole.Admin);
            if (!isModerator)
                throw new MessageOwnershipException(message.Id);
        }

        private void DecryptInPlace(IEnumerable<Message> messages)
        {
            foreach (var m in messages)
                m.Content = _cipher.Decrypt(m.Content);
        }
    }
}
