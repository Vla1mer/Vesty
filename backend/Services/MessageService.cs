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

        public MessageService(IRepositoryManager repository, ILoggerManager logger, IMapper mapper,
            IMessageCipher cipher, ICurrentUserService currentUser, IChatService chatService,
            IChatNotifier notifier)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
            _cipher = cipher;
            _currentUser = currentUser;
            _chatService = chatService;
            _notifier = notifier;
        }

        public async Task<(IEnumerable<MessageDto> messages, MetaData metaData)> GetAllAsync(MessageParameters messageParameters)
        {
            if (!messageParameters.ValidCreatedAtRange)
                throw new MaxCreatedAtRangeBadRequestException();

            var allowedChatIds = await _repository.ChatMember.GetChatIdsForUserAsync(_currentUser.UserId);
            var messagesWithMetaData = await _repository.Message.GetAllMessagesAsync(messageParameters, allowedChatIds, trackChanges: false);
            DecryptInPlace(messagesWithMetaData);
            var messagesDto = _mapper.Map<IEnumerable<MessageDto>>(messagesWithMetaData);
            return (messages: messagesDto, metaData: messagesWithMetaData.MetaData);
        }

        public async Task<MessageDto> GetByIdAsync(int id)
        {
            var message = await GetMessageOrThrowAsync(id, trackChanges: false);
            await EnsureCallerIsChatMember(message.ChatId);
            message.Content = _cipher.Decrypt(message.Content);
            return _mapper.Map<MessageDto>(message);
        }

        public async Task<IEnumerable<MessageDto>> GetMessagesByChatAsync(int chatId, bool trackChanges)
        {
            await GetChatOrThrowAsync(chatId);
            await EnsureCallerIsChatMember(chatId);
            var messages = await _repository.Message.GetMessagesByChatAsync(chatId, trackChanges);
            DecryptInPlace(messages);
            return _mapper.Map<IEnumerable<MessageDto>>(messages);
        }

        public async Task<MessageDto> CreateMessageForChatAsync(int chatId, string content)
        {
            await GetChatOrThrowAsync(chatId);
            await EnsureCallerIsChatMember(chatId);

            var message = new Message
            {
                UserId = _currentUser.UserId,
                Content = _cipher.Encrypt(content)
            };
            _repository.Message.CreateMessageForChat(chatId, message);
            await _repository.SaveAsync();
            message.Content = _cipher.Decrypt(message.Content);

            var messageDto = _mapper.Map<MessageDto>(message);
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
            await _repository.SaveAsync();
            message.Content = content;

            var messageDto = _mapper.Map<MessageDto>(message);
            await _notifier.MessageUpdatedAsync(await GetMemberIdsAsync(chatId), messageDto);
        }

        private async Task<IEnumerable<int>> GetMemberIdsAsync(int chatId)
        {
            var members = await _repository.ChatMember.GetMembersByChatIdAsync(chatId, trackChanges: false);
            return members.Select(m => m.UserId);
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

        private async Task EnsureCallerIsChatMember(int chatId)
        {
            var member = await _currentUser.GetMembershipAsync(chatId);
            if (member is null)
                throw new ChatAccessDeniedException(chatId, _currentUser.UserId);
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
