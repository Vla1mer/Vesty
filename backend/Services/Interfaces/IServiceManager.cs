namespace Services.Interfaces
{
    public interface IServiceManager
    {
        IUserService User { get; }
        IChatService Chat { get; }
        IChatMemberService ChatMember { get; }
        IMessageService Message { get; }
    }
}