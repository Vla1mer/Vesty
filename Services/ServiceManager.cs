using AutoMapper;
using Repository.Interfaces;
using Services.Interfaces;

namespace Services
{
    public sealed class ServiceManager : IServiceManager
    {
        private readonly Lazy<IUserService> _userService;
        private readonly Lazy<IChatService> _chatService;
        private readonly Lazy<IChatMemberService> _chatMemberService;
        private readonly Lazy<IMessageService> _messageService;

        public ServiceManager(IRepositoryManager repositoryManager, ILoggerManager logger, IMapper mapper)
        {
            _userService = new Lazy<IUserService>(() => new UserService(repositoryManager, logger, mapper));
            _chatService = new Lazy<IChatService>(() => new ChatService(repositoryManager, logger, mapper));
            _chatMemberService = new Lazy<IChatMemberService>(() => new ChatMemberService(repositoryManager, logger, mapper));
            _messageService = new Lazy<IMessageService>(() => new MessageService(repositoryManager, logger, mapper));
        }

        public IUserService User => _userService.Value;
        public IChatService Chat => _chatService.Value;
        public IChatMemberService ChatMember => _chatMemberService.Value;
        public IMessageService Message => _messageService.Value;
    }
}