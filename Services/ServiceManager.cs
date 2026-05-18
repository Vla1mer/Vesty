using AutoMapper;
using Entities.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Repository.Interfaces;
using Services.Cryptography;
using Services.Interfaces;

namespace Services
{
    public sealed class ServiceManager : IServiceManager
    {
        private readonly Lazy<IUserService> _userService;
        private readonly Lazy<IChatService> _chatService;
        private readonly Lazy<IChatMemberService> _chatMemberService;
        private readonly Lazy<IMessageService> _messageService;

        public ServiceManager(IRepositoryManager repositoryManager, ILoggerManager logger, IMapper mapper,
            UserManager<User> userManager, IConfiguration configuration, IMessageCipher messageCipher,
            ICurrentUserService currentUser)
        {
            _userService = new Lazy<IUserService>(() => new UserService(repositoryManager, logger, mapper, userManager, configuration));
            _chatService = new Lazy<IChatService>(() => new ChatService(repositoryManager, logger, mapper, currentUser));
            _chatMemberService = new Lazy<IChatMemberService>(() => new ChatMemberService(repositoryManager, logger, mapper, currentUser));
            _messageService = new Lazy<IMessageService>(() => new MessageService(repositoryManager, logger, mapper, messageCipher, currentUser));
        }

        public IUserService User => _userService.Value;
        public IChatService Chat => _chatService.Value;
        public IChatMemberService ChatMember => _chatMemberService.Value;
        public IMessageService Message => _messageService.Value;
    }
}
