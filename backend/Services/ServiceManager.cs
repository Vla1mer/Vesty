using AutoMapper;
using Entities.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Repository.Interfaces;
using Services.Cryptography;
using Services.Interfaces;
using Services.Storage;

namespace Services
{
    public sealed class ServiceManager : IServiceManager
    {
        private readonly Lazy<IUserService> _userService;
        private readonly Lazy<IAvatarService> _avatarService;
        private readonly Lazy<IChatAvatarService> _chatAvatarService;
        private readonly Lazy<IChatService> _chatService;
        private readonly Lazy<IChatMemberService> _chatMemberService;
        private readonly Lazy<IMessageService> _messageService;
        private readonly Lazy<IReactionService> _reactionService;
        private readonly Lazy<IAttachmentService> _attachmentService;
        private readonly Lazy<IFriendService> _friendService;
        private readonly Lazy<IBlockService> _blockService;
        private readonly Lazy<IChatInviteService> _chatInviteService;
        private readonly Lazy<IPresenceService> _presenceService;

        public ServiceManager(IRepositoryManager repositoryManager, ILoggerManager logger, IMapper mapper,
            UserManager<User> userManager, IConfiguration configuration, IMessageCipher messageCipher,
            ICurrentUserService currentUser, IChatNotifier chatNotifier, IFileStorage fileStorage,
            IPresenceTracker presenceTracker)
        {
            _userService = new Lazy<IUserService>(() => new UserService(repositoryManager, logger, mapper, userManager, configuration, currentUser));
            _avatarService = new Lazy<IAvatarService>(() => new AvatarService(repositoryManager, currentUser));
            _chatAvatarService = new Lazy<IChatAvatarService>(() => new ChatAvatarService(repositoryManager, currentUser));
            _chatService = new Lazy<IChatService>(() => new ChatService(repositoryManager, logger, mapper, currentUser, chatNotifier, messageCipher));
            _chatMemberService = new Lazy<IChatMemberService>(() => new ChatMemberService(repositoryManager, logger, mapper, currentUser, chatNotifier));
            _messageService = new Lazy<IMessageService>(() => new MessageService(repositoryManager, logger, mapper, messageCipher, currentUser, _chatService.Value, chatNotifier, _attachmentService.Value));
            _reactionService = new Lazy<IReactionService>(() => new ReactionService(repositoryManager, currentUser, chatNotifier));
            _attachmentService = new Lazy<IAttachmentService>(() => new AttachmentService(repositoryManager, currentUser, fileStorage));
            _friendService = new Lazy<IFriendService>(() => new FriendService(repositoryManager, currentUser, chatNotifier));
            _blockService = new Lazy<IBlockService>(() => new BlockService(repositoryManager, currentUser));
            _chatInviteService = new Lazy<IChatInviteService>(() => new ChatInviteService(repositoryManager, currentUser, chatNotifier, mapper));
            _presenceService = new Lazy<IPresenceService>(() => new PresenceService(repositoryManager, currentUser, presenceTracker, chatNotifier));
        }

        public IUserService User => _userService.Value;
        public IAvatarService Avatar => _avatarService.Value;
        public IChatAvatarService ChatAvatar => _chatAvatarService.Value;
        public IChatService Chat => _chatService.Value;
        public IChatMemberService ChatMember => _chatMemberService.Value;
        public IMessageService Message => _messageService.Value;
        public IReactionService Reaction => _reactionService.Value;
        public IAttachmentService Attachment => _attachmentService.Value;
        public IFriendService Friend => _friendService.Value;
        public IBlockService Block => _blockService.Value;
        public IChatInviteService ChatInvite => _chatInviteService.Value;
        public IPresenceService Presence => _presenceService.Value;
    }
}
