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
        IReactionRepository Reaction { get; }
        IAttachmentRepository Attachment { get; }
        IFriendshipRepository Friendship { get; }
        IUserBlockRepository UserBlock { get; }
        IChatInviteRepository ChatInvite { get; }
        Task SaveAsync();
    }
}