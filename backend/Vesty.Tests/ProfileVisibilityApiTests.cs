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

        private static async Task<UserDto> FindAsync(HttpClient client, string userName)
        {
            var found = await client.GetFromJsonAsync<List<UserDto>>(
                $"/api/User?searchTerm={userName}&pageSize=20");
            return found!.Single(u => u.UserName == userName);
        }

        [Fact]
        public async Task Search_HidesTheNameOfAClosedProfile()
        {
            var ownerName = UniqueName("vis10a");
            var owner = await AuthenticatedClientAsync(ownerName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await DescribeAsync(owner, ownerId, ownerName);
            await HideProfileAsync(owner, PrivacyLevel.Nobody);

            var stranger = await AuthenticatedClientAsync(UniqueName("vis10b"));
            var found = await FindAsync(stranger, ownerName);

            Assert.True(found.IsProfileHidden);
            Assert.Null(found.Name);
            Assert.Null(found.Surname);
        }

        [Fact]
        public async Task Search_ShowsTheNameOfAFriendWhoAllowsFriends()
        {
            var ownerName = UniqueName("vis11a");
            var owner = await AuthenticatedClientAsync(ownerName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await DescribeAsync(owner, ownerId, ownerName);
            await HideProfileAsync(owner, PrivacyLevel.FriendsOnly);

            var friendName = UniqueName("vis11b");
            var friend = await AuthenticatedClientAsync(friendName);
            var friendId = await UserIdAsync(friend, friendName);
            await FriendshipSetup.BefriendAsync(friend, friendId, owner, ownerId);

            var found = await FindAsync(friend, ownerName);

            Assert.False(found.IsProfileHidden);
            Assert.Equal("Vlad", found.Name);
        }

        [Fact]
        public async Task Search_HidesTheNameFromANonFriend()
        {
            var ownerName = UniqueName("vis12a");
            var owner = await AuthenticatedClientAsync(ownerName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await DescribeAsync(owner, ownerId, ownerName);
            await HideProfileAsync(owner, PrivacyLevel.FriendsOnly);

            var stranger = await AuthenticatedClientAsync(UniqueName("vis12b"));
            var found = await FindAsync(stranger, ownerName);

            Assert.True(found.IsProfileHidden);
            Assert.Null(found.Name);
        }

        [Fact]
        public async Task Search_NeverCarriesThePhone()
        {
            var ownerName = UniqueName("vis13a");
            var owner = await AuthenticatedClientAsync(ownerName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await DescribeAsync(owner, ownerId, ownerName);

            var stranger = await AuthenticatedClientAsync(UniqueName("vis13b"));
            var found = await FindAsync(stranger, ownerName);

            Assert.Null(found.Phone);
            Assert.Equal("Vlad", found.Name);
        }

        [Fact]
        public async Task Collection_HidesTheNameOfAClosedProfile()
        {
            var ownerName = UniqueName("vis14a");
            var owner = await AuthenticatedClientAsync(ownerName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await DescribeAsync(owner, ownerId, ownerName);
            await HideProfileAsync(owner, PrivacyLevel.Nobody);

            var openName = UniqueName("vis14b");
            var open = await AuthenticatedClientAsync(openName);
            var openId = await UserIdAsync(open, openName);
            await DescribeAsync(open, openId, openName);

            var stranger = await AuthenticatedClientAsync(UniqueName("vis14c"));
            var users = await stranger.GetFromJsonAsync<List<UserDto>>(
                $"/api/User/collection/({ownerId},{openId})");

            var hidden = users!.Single(u => u.Id == ownerId);
            var shown = users!.Single(u => u.Id == openId);
            Assert.True(hidden.IsProfileHidden);
            Assert.Null(hidden.Name);
            Assert.False(shown.IsProfileHidden);
            Assert.Equal("Vlad", shown.Name);
        }

        [Fact]
        public async Task FriendList_HidesTheNameOfSomeoneOpenToNobody()
        {
            var shyName = UniqueName("vis15a");
            var shy = await AuthenticatedClientAsync(shyName);
            var shyId = await UserIdAsync(shy, shyName);
            await DescribeAsync(shy, shyId, shyName);

            var friendName = UniqueName("vis15b");
            var friend = await AuthenticatedClientAsync(friendName);
            var friendId = await UserIdAsync(friend, friendName);
            await FriendshipSetup.BefriendAsync(friend, friendId, shy, shyId);
            await HideProfileAsync(shy, PrivacyLevel.Nobody);

            var friends = await friend.GetFromJsonAsync<List<FriendDto>>("/api/Friend");
            var listed = friends!.Single(f => f.UserId == shyId);

            Assert.Null(listed.Name);
            Assert.Null(listed.Surname);
            Assert.Equal(shyName, listed.UserName);
        }

        [Fact]
        public async Task FriendList_ShowsTheNameOfSomeoneOpenToFriends()
        {
            var ownerName = UniqueName("vis16a");
            var owner = await AuthenticatedClientAsync(ownerName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await DescribeAsync(owner, ownerId, ownerName);

            var friendName = UniqueName("vis16b");
            var friend = await AuthenticatedClientAsync(friendName);
            var friendId = await UserIdAsync(friend, friendName);
            await FriendshipSetup.BefriendAsync(friend, friendId, owner, ownerId);
            await HideProfileAsync(owner, PrivacyLevel.FriendsOnly);

            var friends = await friend.GetFromJsonAsync<List<FriendDto>>("/api/Friend");
            var listed = friends!.Single(f => f.UserId == ownerId);

            Assert.Equal("Vlad", listed.Name);
        }

        [Fact]
        public async Task PendingRequest_HidesTheNameOfSomeoneOpenToFriendsOnly()
        {
            var shyName = UniqueName("vis17a");
            var shy = await AuthenticatedClientAsync(shyName);
            var shyId = await UserIdAsync(shy, shyName);
            await DescribeAsync(shy, shyId, shyName);
            await HideProfileAsync(shy, PrivacyLevel.FriendsOnly);

            var strangerName = UniqueName("vis17b");
            var stranger = await AuthenticatedClientAsync(strangerName);
            (await shy.PostAsync($"/api/Friend/{await UserIdAsync(shy, strangerName)}", null))
                .EnsureSuccessStatusCode();

            var requests = await stranger.GetFromJsonAsync<List<FriendDto>>(
                "/api/Friend/requests");
            var listed = requests!.Single(f => f.UserId == shyId);

            Assert.Null(listed.Name);
            Assert.Equal(shyName, listed.UserName);
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
