using System.Net;
using System.Net.Http.Json;
using Entities.Models;
using Services.DataTransferObjects;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class ProfileVisibilityApiTests : ApiTestBase
    {
        public ProfileVisibilityApiTests(VestyApiFactory factory) : base(factory)
        {
        }

        private static async Task DescribeAsync(HttpClient client, int userId, string userName)
        {
            var updated = await client.PutAsJsonAsync($"/api/User/{userId}", new
            {
                userName,
                name = "Vlad",
                surname = "Petrov",
                phone = "+1234567890"
            });
            updated.EnsureSuccessStatusCode();
        }

        private static async Task<UserDto> ProfileAsync(HttpClient client, int userId)
        {
            var response = await client.GetAsync($"/api/User/{userId}");
            response.EnsureSuccessStatusCode();
            return (await response.Content.ReadFromJsonAsync<UserDto>())!;
        }

        private static async Task HideProfileAsync(HttpClient client, int level)
        {
            await SetPrivacyAsync(client, PrivacyLevel.Everyone, PrivacyLevel.Everyone, level);
        }

        [Fact]
        public async Task OwnProfile_KeepsThePhone()
        {
            var name = UniqueName("vis1");
            var me = await AuthenticatedClientAsync(name);
            var myId = await UserIdAsync(me, name);
            await DescribeAsync(me, myId, name);

            var profile = await ProfileAsync(me, myId);

            Assert.Equal("+1234567890", profile.Phone);
            Assert.False(profile.IsProfileHidden);
        }

        [Fact]
        public async Task SomeoneElsesProfile_NeverCarriesThePhone()
        {
            var ownerName = UniqueName("vis2a");
            var owner = await AuthenticatedClientAsync(ownerName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await DescribeAsync(owner, ownerId, ownerName);

            var stranger = await AuthenticatedClientAsync(UniqueName("vis2b"));
            var profile = await ProfileAsync(stranger, ownerId);

            Assert.Null(profile.Phone);
            Assert.Equal("Vlad", profile.Name);
        }

        [Fact]
        public async Task ProfileOpenToEveryone_ShowsTheName()
        {
            var ownerName = UniqueName("vis3a");
            var owner = await AuthenticatedClientAsync(ownerName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await DescribeAsync(owner, ownerId, ownerName);

            var stranger = await AuthenticatedClientAsync(UniqueName("vis3b"));
            var profile = await ProfileAsync(stranger, ownerId);

            Assert.False(profile.IsProfileHidden);
            Assert.Equal("Vlad", profile.Name);
            Assert.Equal("Petrov", profile.Surname);
        }

        [Fact]
        public async Task ProfileOpenToNobody_HidesTheNameButKeepsTheUserName()
        {
            var ownerName = UniqueName("vis4a");
            var owner = await AuthenticatedClientAsync(ownerName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await DescribeAsync(owner, ownerId, ownerName);
            await HideProfileAsync(owner, PrivacyLevel.Nobody);

            var stranger = await AuthenticatedClientAsync(UniqueName("vis4b"));
            var profile = await ProfileAsync(stranger, ownerId);

            Assert.True(profile.IsProfileHidden);
            Assert.Null(profile.Name);
            Assert.Null(profile.Surname);
            Assert.Equal(ownerName, profile.UserName);
        }

        [Fact]
        public async Task ProfileOpenToNobody_StaysOpenToItsOwner()
        {
            var ownerName = UniqueName("vis5");
            var owner = await AuthenticatedClientAsync(ownerName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await DescribeAsync(owner, ownerId, ownerName);
            await HideProfileAsync(owner, PrivacyLevel.Nobody);

            var profile = await ProfileAsync(owner, ownerId);

            Assert.False(profile.IsProfileHidden);
            Assert.Equal("Vlad", profile.Name);
        }

        [Fact]
        public async Task ProfileForFriendsOnly_IsHiddenFromAStranger()
        {
            var ownerName = UniqueName("vis6a");
            var owner = await AuthenticatedClientAsync(ownerName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await DescribeAsync(owner, ownerId, ownerName);
            await HideProfileAsync(owner, PrivacyLevel.FriendsOnly);

            var stranger = await AuthenticatedClientAsync(UniqueName("vis6b"));
            var profile = await ProfileAsync(stranger, ownerId);

            Assert.True(profile.IsProfileHidden);
            Assert.Null(profile.Name);
        }

        [Fact]
        public async Task ProfileForFriendsOnly_IsOpenToAFriend()
        {
            var ownerName = UniqueName("vis7a");
            var owner = await AuthenticatedClientAsync(ownerName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await DescribeAsync(owner, ownerId, ownerName);
            await HideProfileAsync(owner, PrivacyLevel.FriendsOnly);

            var friendName = UniqueName("vis7b");
            var friend = await AuthenticatedClientAsync(friendName);
            var friendId = await UserIdAsync(friend, friendName);
            await FriendshipSetup.BefriendAsync(friend, friendId, owner, ownerId);

            var profile = await ProfileAsync(friend, ownerId);

            Assert.False(profile.IsProfileHidden);
            Assert.Equal("Vlad", profile.Name);
        }

        [Fact]
        public async Task BlockedUser_SeesNoProfileEvenWhenItIsOpen()
        {
            var ownerName = UniqueName("vis8a");
            var owner = await AuthenticatedClientAsync(ownerName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await DescribeAsync(owner, ownerId, ownerName);

            var blockedName = UniqueName("vis8b");
            var blocked = await AuthenticatedClientAsync(blockedName);
            var blockedId = await UserIdAsync(blocked, blockedName);
            (await owner.PostAsync($"/api/Block/{blockedId}", null)).EnsureSuccessStatusCode();

            var profile = await ProfileAsync(blocked, ownerId);

            Assert.True(profile.IsProfileHidden);
            Assert.Null(profile.Name);
        }

        [Fact]
        public async Task UnknownUser_IsStillNotFound()
        {
            var client = await AuthenticatedClientAsync(UniqueName("vis9"));

            var response = await client.GetAsync("/api/User/999999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
