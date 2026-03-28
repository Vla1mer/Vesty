using Contracts;

namespace internship.Repository
{
    public class RepositoryManager : IRepositoryManager
    {
        private readonly AppDbContext _context;
        private IUserRepository? _userRepository;
        private IChatRepository? _chatRepository;
        private IChatMemberRepository? _chatMemberRepository;
        private IMessageRepository? _messageRepository;

        public RepositoryManager(AppDbContext context)
            => _context = context;

        public IUserRepository User =>
            _userRepository ??= new UserRepository(_context);

        public IChatRepository Chat =>
            _chatRepository ??= new ChatRepository(_context);

        public IChatMemberRepository ChatMember =>
            _chatMemberRepository ??= new ChatMemberRepository(_context);

        public IMessageRepository Message =>
            _messageRepository ??= new MessageRepository(_context);

        public async Task SaveAsync() => await _context.SaveChangesAsync();
    }
}