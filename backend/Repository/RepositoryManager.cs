using System.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Repository.Interfaces;
using Shared.Exceptions;

namespace Repository
{
    public sealed class RepositoryManager : IRepositoryManager
    {
        private const string UniqueViolation = "23505";
        private const string SerializationFailure = "40001";
        private const string DeadlockDetected = "40P01";
        private const int MaxTransactionAttempts = 3;

        private readonly AppDbContext _context;
        private readonly Lazy<IUserRepository> _userRepository;
        private readonly Lazy<IAvatarRepository> _avatarRepository;
        private readonly Lazy<IChatAvatarRepository> _chatAvatarRepository;
        private readonly Lazy<IChatRepository> _chatRepository;
        private readonly Lazy<IChatMemberRepository> _chatMemberRepository;
        private readonly Lazy<IMessageRepository> _messageRepository;
        private readonly Lazy<IReactionRepository> _reactionRepository;
        private readonly Lazy<IAttachmentRepository> _attachmentRepository;
        private readonly Lazy<IFriendshipRepository> _friendshipRepository;
        private readonly Lazy<IUserBlockRepository> _userBlockRepository;
        private readonly Lazy<IChatInviteRepository> _chatInviteRepository;

        public RepositoryManager(AppDbContext context)
        {
            _context = context;
            _userRepository = new Lazy<IUserRepository>(() => new UserRepository(context));
            _avatarRepository = new Lazy<IAvatarRepository>(() => new AvatarRepository(context));
            _chatAvatarRepository = new Lazy<IChatAvatarRepository>(() => new ChatAvatarRepository(context));
            _chatRepository = new Lazy<IChatRepository>(() => new ChatRepository(context));
            _chatMemberRepository = new Lazy<IChatMemberRepository>(() => new ChatMemberRepository(context));
            _messageRepository = new Lazy<IMessageRepository>(() => new MessageRepository(context));
            _reactionRepository = new Lazy<IReactionRepository>(() => new ReactionRepository(context));
            _attachmentRepository = new Lazy<IAttachmentRepository>(() => new AttachmentRepository(context));
            _friendshipRepository = new Lazy<IFriendshipRepository>(() => new FriendshipRepository(context));
            _userBlockRepository = new Lazy<IUserBlockRepository>(() => new UserBlockRepository(context));
            _chatInviteRepository = new Lazy<IChatInviteRepository>(() => new ChatInviteRepository(context));
        }

        public IUserRepository User => _userRepository.Value;
        public IAvatarRepository Avatar => _avatarRepository.Value;
        public IChatAvatarRepository ChatAvatar => _chatAvatarRepository.Value;
        public IChatRepository Chat => _chatRepository.Value;
        public IChatMemberRepository ChatMember => _chatMemberRepository.Value;
        public IMessageRepository Message => _messageRepository.Value;
        public IReactionRepository Reaction => _reactionRepository.Value;
        public IAttachmentRepository Attachment => _attachmentRepository.Value;
        public IFriendshipRepository Friendship => _friendshipRepository.Value;
        public IUserBlockRepository UserBlock => _userBlockRepository.Value;
        public IChatInviteRepository ChatInvite => _chatInviteRepository.Value;

        private static void DetachPendingInserts(DbUpdateException ex)
        {
            foreach (var entry in ex.Entries.Where(e => e.State == EntityState.Added))
                entry.State = EntityState.Detached;
        }

        public async Task SaveAsync()
        {
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: UniqueViolation })
            {
                DetachPendingInserts(ex);
                throw new DuplicateResourceException();
            }
        }

        private static bool IsConcurrencyConflict(Exception exception) =>
            Unwrap(exception) is PostgresException
            {
                SqlState: SerializationFailure or DeadlockDetected
            };

        private static Exception Unwrap(Exception exception) =>
            exception is DbUpdateException { InnerException: { } inner } ? inner : exception;

        public async Task ExecuteInTransactionAsync(Func<Task> action)
        {
            if (_context.Database.CurrentTransaction is not null)
            {
                try
                {
                    await action();
                }
                catch (Exception ex) when (IsConcurrencyConflict(ex))
                {
                    throw new ConcurrentUpdateException();
                }
                return;
            }

            for (var attempt = 1; ; attempt++)
            {
                try
                {
                    await using var transaction =
                        await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

                    await action();
                    await transaction.CommitAsync();
                    return;
                }
                catch (Exception ex) when (IsConcurrencyConflict(ex))
                {
                    _context.ChangeTracker.Clear();

                    if (attempt == MaxTransactionAttempts)
                        throw new ConcurrentUpdateException();
                }
            }
        }
    }
}