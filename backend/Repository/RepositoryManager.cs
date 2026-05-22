using Repository.Interfaces;

namespace Repository
{
    public sealed class RepositoryManager : IRepositoryManager
    {
        private readonly AppDbContext _context;
        private readonly Lazy<IUserRepository> _userRepository;
        private readonly Lazy<IChatRepository> _chatRepository;
        private readonly Lazy<IChatMemberRepository> _chatMemberRepository;
        private readonly Lazy<IMessageRepository> _messageRepository;

        public RepositoryManager(AppDbContext context)
        {
            _context = context;
            _userRepository = new Lazy<IUserRepository>(() => new UserRepository(context));
            _chatRepository = new Lazy<IChatRepository>(() => new ChatRepository(context));
            _chatMemberRepository = new Lazy<IChatMemberRepository>(() => new ChatMemberRepository(context));
            _messageRepository = new Lazy<IMessageRepository>(() => new MessageRepository(context));
        }

        public IUserRepository User => _userRepository.Value;
        public IChatRepository Chat => _chatRepository.Value;
        public IChatMemberRepository ChatMember => _chatMemberRepository.Value;
        public IMessageRepository Message => _messageRepository.Value;

        public async Task SaveAsync() => await _context.SaveChangesAsync();
    }
}