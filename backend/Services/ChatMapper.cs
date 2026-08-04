using Entities.Models;
using Services.DataTransferObjects;
using Shared.RequestFeatures;

namespace Services
{
    internal static class ChatMapper
    {
        public static DirectChatDto ToDirectChatDto(ChatDto chat, DirectChatPartner? partner) =>
            new DirectChatDto
            {
                Id = chat.Id,
                Name = chat.Name,
                Description = chat.Description,
                WhoCanInvite = chat.WhoCanInvite,
                WhoCanEdit = chat.WhoCanEdit,
                WhoCanPost = chat.WhoCanPost,
                CreatorId = chat.CreatorId,
                IsPrivate = chat.IsPrivate,
                CreatedAt = chat.CreatedAt,
                LastMessageContent = chat.LastMessageContent,
                LastMessageSenderName = chat.LastMessageSenderName,
                LastMessageSenderId = chat.LastMessageSenderId,
                LastMessageAt = chat.LastMessageAt,
                UnreadCount = chat.UnreadCount,
                AvatarUpdatedAt = chat.AvatarUpdatedAt,
                PartnerUserName = partner?.UserName,
                PartnerUserId = partner?.UserId,
                PartnerAvatarUpdatedAt = partner?.AvatarUpdatedAt
            };

        public static DirectChatPartner ToPartner(User user) =>
            new DirectChatPartner
            {
                UserId = user.Id,
                UserName = user.UserName,
                AvatarUpdatedAt = user.AvatarUpdatedAt
            };
    }
}
