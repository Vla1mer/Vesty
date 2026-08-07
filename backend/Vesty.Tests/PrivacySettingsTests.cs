using AutoMapper;
using Entities.Models;
using Moq;
using Repository.Interfaces;
using Services;
using Services.DataTransferObjects;
using Services.Cryptography;
using Services.Interfaces;
using Shared.Exceptions;

namespace Vesty.Tests
{
    public class PrivacySettingsTests
    {
        private const int CurrentUserId = 1;
        private const int TargetUserId = 2;
        private const int ChatId = 10;

        private readonly Mock<IRepositoryManager> _repository = new();
        private readonly Mock<IUserRepository> _users = new();
        private readonly Mock<IChatRepository> _chats = new();
        private readonly Mock<IChatMemberRepository> _members = new();
        private readonly Mock<IFriendshipRepository> _friendships = new();
        private readonly Mock<IUserBlockRepository> _blocks = new();
        private readonly Mock<ICurrentUserService> _currentUser = new();
        private readonly Mock<IChatNotifier> _notifier = new();
        private readonly Mock<ILoggerManager> _logger = new();
        private readonly Mock<IMapper> _mapper = new();
        private readonly Mock<IMessageCipher> _cipher = new();

        private readonly ChatService _chatService;
        private readonly ChatMemberService _memberService;
        private readonly UserService _userService;

        public PrivacySettingsTests()
        {
            _repository.SetupGet(r => r.User).Returns(_users.Object);
            _repository.SetupGet(r => r.Chat).Returns(_chats.Object);
            _repository.SetupGet(r => r.ChatMember).Returns(_members.Object);
            _repository.SetupGet(r => r.Friendship).Returns(_friendships.Object);
            _repository.SetupGet(r => r.UserBlock).Returns(_blocks.Object);
            _blocks.Setup(r => r.IsBlockedEitherWayAsync(It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(false);
            _currentUser.SetupGet(u => u.UserId).Returns(CurrentUserId);

            _chats.Setup(r => r.GetPrivateChatBetweenAsync(It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync((Chat?)null);

            _chatService = new ChatService(_repository.Object, _logger.Object, _mapper.Object,
                _currentUser.Object, _notifier.Object, _cipher.Object);
            _memberService = new ChatMemberService(_repository.Object, _logger.Object, _mapper.Object,
                _currentUser.Object, _notifier.Object);
            _userService = new UserService(_repository.Object, _logger.Object, _mapper.Object,
                null!, null!, _currentUser.Object);
        }

        private void TargetWithPrivacy(int whoCanMessage, int whoCanInvite)
        {
            _users.Setup(r => r.GetUserAsync(TargetUserId, false))
                .ReturnsAsync(new User
                {
                    Id = TargetUserId,
                    UserName = "target",
                    WhoCanMessage = whoCanMessage,
                    WhoCanInvite = whoCanInvite
                });
        }

        private void AreFriends(bool friends) =>
            _friendships.Setup(r => r.AreFriendsAsync(CurrentUserId, TargetUserId))
                .ReturnsAsync(friends);

        private void CallerIsChatOwner() =>
            _currentUser.Setup(u => u.GetMembershipAsync(ChatId))
                .ReturnsAsync(new ChatMember { ChatId = ChatId, UserId = CurrentUserId, RoleId = UserRole.Owner });


        [Fact]
        public async Task DirectChat_WhenTargetAllowsEveryone_IsNotBlocked()
        {
            TargetWithPrivacy(PrivacyLevel.Everyone, PrivacyLevel.Everyone);

            var exception = await Record.ExceptionAsync(() =>
                _chatService.CreateDirectChatAsync(TargetUserId));

            Assert.IsNotType<PrivacyRestrictedException>(exception);
            _friendships.Verify(r => r.AreFriendsAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }

        [Fact]
        public async Task DirectChat_WhenTargetAllowsNobody_Throws()
        {
            TargetWithPrivacy(PrivacyLevel.Nobody, PrivacyLevel.Everyone);

            await Assert.ThrowsAsync<PrivacyRestrictedException>(() =>
                _chatService.CreateDirectChatAsync(TargetUserId));
        }

        [Fact]
        public async Task DirectChat_WhenFriendsOnlyAndNotFriends_Throws()
        {
            TargetWithPrivacy(PrivacyLevel.FriendsOnly, PrivacyLevel.Everyone);
            AreFriends(false);

            await Assert.ThrowsAsync<PrivacyRestrictedException>(() =>
                _chatService.CreateDirectChatAsync(TargetUserId));
        }

        [Fact]
        public async Task DirectChat_WhenFriendsOnlyAndFriends_PassesTheCheck()
        {
            TargetWithPrivacy(PrivacyLevel.FriendsOnly, PrivacyLevel.Everyone);
            AreFriends(true);

            var exception = await Record.ExceptionAsync(() =>
                _chatService.CreateDirectChatAsync(TargetUserId));

            Assert.IsNotType<PrivacyRestrictedException>(exception);
            _friendships.Verify(r => r.AreFriendsAsync(CurrentUserId, TargetUserId), Times.Once);
        }

        [Fact]
        public async Task DirectChat_WithExistingConversation_SkipsThePrivacyCheck()
        {
            TargetWithPrivacy(PrivacyLevel.Nobody, PrivacyLevel.Everyone);
            _chats.Setup(r => r.GetPrivateChatBetweenAsync(CurrentUserId, TargetUserId))
                .ReturnsAsync(new Chat { Id = 5, IsPrivate = true });

            var exception = await Record.ExceptionAsync(() =>
                _chatService.CreateDirectChatAsync(TargetUserId));

            Assert.IsNotType<PrivacyRestrictedException>(exception);
        }


        [Fact]
        public async Task Invite_WhenTargetAllowsNobody_Throws()
        {
            CallerIsChatOwner();
            TargetWithPrivacy(PrivacyLevel.Everyone, PrivacyLevel.Nobody);
            _chats.Setup(r => r.GetChatAsync(ChatId, false))
                .ReturnsAsync(new Chat { Id = ChatId, IsPrivate = false });
            _members.Setup(r => r.IsUserInChatAsync(ChatId, TargetUserId)).ReturnsAsync(false);

            await Assert.ThrowsAsync<PrivacyRestrictedException>(() =>
                _memberService.AddUserToChatAsync(ChatId, new ChatMemberForCreationDto { UserId = TargetUserId }));
        }

        [Fact]
        public async Task Invite_WhenFriendsOnlyAndNotFriends_Throws()
        {
            CallerIsChatOwner();
            TargetWithPrivacy(PrivacyLevel.Everyone, PrivacyLevel.FriendsOnly);
            AreFriends(false);
            _chats.Setup(r => r.GetChatAsync(ChatId, false))
                .ReturnsAsync(new Chat { Id = ChatId, IsPrivate = false });
            _members.Setup(r => r.IsUserInChatAsync(ChatId, TargetUserId)).ReturnsAsync(false);

            await Assert.ThrowsAsync<PrivacyRestrictedException>(() =>
                _memberService.AddUserToChatAsync(ChatId, new ChatMemberForCreationDto { UserId = TargetUserId }));
        }


        private void Blocked() =>
            _blocks.Setup(r => r.IsBlockedEitherWayAsync(CurrentUserId, TargetUserId))
                .ReturnsAsync(true);

        [Fact]
        public async Task DirectChat_WhenBlocked_Throws()
        {
            TargetWithPrivacy(PrivacyLevel.Everyone, PrivacyLevel.Everyone);
            Blocked();

            await Assert.ThrowsAsync<BlockedUserException>(() =>
                _chatService.CreateDirectChatAsync(TargetUserId));
        }

        [Fact]
        public async Task DirectChat_WhenBlocked_ChecksBeforeLookingForExistingChat()
        {
            TargetWithPrivacy(PrivacyLevel.Everyone, PrivacyLevel.Everyone);
            Blocked();

            await Assert.ThrowsAsync<BlockedUserException>(() =>
                _chatService.CreateDirectChatAsync(TargetUserId));

            _chats.Verify(r => r.GetPrivateChatBetweenAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }

        [Fact]
        public async Task Invite_WhenBlocked_Throws()
        {
            CallerIsChatOwner();
            TargetWithPrivacy(PrivacyLevel.Everyone, PrivacyLevel.Everyone);
            Blocked();
            _chats.Setup(r => r.GetChatAsync(ChatId, false))
                .ReturnsAsync(new Chat { Id = ChatId, IsPrivate = false });
            _members.Setup(r => r.IsUserInChatAsync(ChatId, TargetUserId)).ReturnsAsync(false);

            await Assert.ThrowsAsync<BlockedUserException>(() =>
                _memberService.AddUserToChatAsync(ChatId, new ChatMemberForCreationDto { UserId = TargetUserId }));
        }


        [Theory]
        [InlineData(0, PrivacyLevel.Everyone, PrivacyLevel.Everyone, PrivacyLevel.Everyone)]
        [InlineData(PrivacyLevel.Everyone, 4, PrivacyLevel.Everyone, PrivacyLevel.Everyone)]
        [InlineData(PrivacyLevel.Everyone, PrivacyLevel.Everyone, 0, PrivacyLevel.Everyone)]
        [InlineData(PrivacyLevel.Everyone, PrivacyLevel.Everyone, 4, PrivacyLevel.Everyone)]
        [InlineData(PrivacyLevel.Everyone, PrivacyLevel.Everyone, PrivacyLevel.Everyone, 0)]
        [InlineData(PrivacyLevel.Everyone, PrivacyLevel.Everyone, PrivacyLevel.Everyone, 4)]
        [InlineData(-1, -1, -1, -1)]
        public async Task UpdatePrivacyAsync_WithUnknownLevel_Throws(
            int message, int invite, int profile, int online)
        {
            await Assert.ThrowsAsync<InvalidPrivacyLevelException>(() =>
                _userService.UpdatePrivacyAsync(new PrivacySettingsDto
                {
                    WhoCanMessage = message,
                    WhoCanInvite = invite,
                    WhoCanSeeProfile = profile,
                    WhoCanSeeOnline = online
                }));
        }

        [Fact]
        public async Task UpdatePrivacyAsync_StoresEveryLevel()
        {
            var user = new User { Id = CurrentUserId, UserName = "me" };
            _users.Setup(r => r.GetUserAsync(CurrentUserId, true)).ReturnsAsync(user);

            await _userService.UpdatePrivacyAsync(new PrivacySettingsDto
            {
                WhoCanMessage = PrivacyLevel.FriendsOnly,
                WhoCanInvite = PrivacyLevel.Nobody,
                WhoCanSeeProfile = PrivacyLevel.FriendsOnly,
                WhoCanSeeOnline = PrivacyLevel.Nobody
            });

            Assert.Equal(PrivacyLevel.FriendsOnly, user.WhoCanMessage);
            Assert.Equal(PrivacyLevel.Nobody, user.WhoCanInvite);
            Assert.Equal(PrivacyLevel.FriendsOnly, user.WhoCanSeeProfile);
            Assert.Equal(PrivacyLevel.Nobody, user.WhoCanSeeOnline);
            _repository.Verify(r => r.SaveAsync(), Times.Once);
        }

        [Fact]
        public async Task GetPrivacyAsync_ReturnsStoredLevels()
        {
            _users.Setup(r => r.GetUserAsync(CurrentUserId, false))
                .ReturnsAsync(new User
                {
                    Id = CurrentUserId,
                    UserName = "me",
                    WhoCanMessage = PrivacyLevel.Nobody,
                    WhoCanInvite = PrivacyLevel.FriendsOnly,
                    WhoCanSeeProfile = PrivacyLevel.Nobody,
                    WhoCanSeeOnline = PrivacyLevel.FriendsOnly
                });

            var settings = await _userService.GetPrivacyAsync();

            Assert.Equal(PrivacyLevel.Nobody, settings.WhoCanMessage);
            Assert.Equal(PrivacyLevel.FriendsOnly, settings.WhoCanInvite);
            Assert.Equal(PrivacyLevel.Nobody, settings.WhoCanSeeProfile);
            Assert.Equal(PrivacyLevel.FriendsOnly, settings.WhoCanSeeOnline);
        }
    }
}
