namespace Services.Interfaces
{
    public interface IServiceManager
    {
        IUserService User { get; }
        IAvatarService Avatar { get; }
        IChatAvatarService ChatAvatar { get; }
        IChatService Chat { get; }
        IChatMemberService ChatMember { get; }
        IMessageService Message { get; }
        IReactionService Reaction { get; }
        IAttachmentService Attachment { get; }
        IFriendService Friend { get; }
        IBlockService Block { get; }
        IChatInviteService ChatInvite { get; }
        IPresenceService Presence { get; }
    }
}