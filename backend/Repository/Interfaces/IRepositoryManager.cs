namespace Repository.Interfaces
{
    public interface IRepositoryManager
    {
        IUserRepository User { get; }
        IAvatarRepository Avatar { get; }
        IChatAvatarRepository ChatAvatar { get; }
        IChatRepository Chat { get; }
        IChatMemberRepository ChatMember { get; }
        IMessageRepository Message { get; }
        Task SaveAsync();
    }
}