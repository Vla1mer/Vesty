namespace Contracts
{
    public interface IRepositoryManager
    {
        IUserRepository User { get; }
        IChatRepository Chat { get; }
        IChatMemberRepository ChatMember { get; }
        IMessageRepository Message { get; }
        void Save();
    }
}