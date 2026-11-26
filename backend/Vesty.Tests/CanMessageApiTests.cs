using System.Net;
using System.Net.Http.Json;
using Entities.Models;
using Services.DataTransferObjects;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class CanMessageApiTests : ApiTestBase
    {
        public CanMessageApiTests(VestyApiFactory factory) : base(factory)
        {
        }

        private static async Task<UserDto> ProfileAsync(Account viewer, Account owner) =>
            (await viewer.Client.GetFromJsonAsync<UserDto>($"/api/User/{owner.Id}"))!;

        private static Task AcceptMessagesFromAsync(Account owner, int level) =>
            SetPrivacyAsync(owner.Client, PrivacyLevel.Everyone, whoCanMessage: level);

        [Fact]
        public async Task OpenMessages_AllowEveryone()
        {
            var owner = await AccountAsync("cm1a");
            var stranger = await AccountAsync("cm1b");

            Assert.True((await ProfileAsync(stranger, owner)).CanMessage);
        }

        [Fact]
        public async Task MessagesForFriendsOnly_AreClosedToAStranger()
        {
            var owner = await AccountAsync("cm2a");
            var stranger = await AccountAsync("cm2b");
            await AcceptMessagesFromAsync(owner, PrivacyLevel.FriendsOnly);

            Assert.False((await ProfileAsync(stranger, owner)).CanMessage);
        }

        [Fact]
        public async Task MessagesForFriendsOnly_AreOpenToAFriend()
        {
            var owner = await AccountAsync("cm3a");
            var friend = await AccountAsync("cm3b");
            await AcceptMessagesFromAsync(owner, PrivacyLevel.FriendsOnly);
            await FriendshipSetup.BefriendAsync(friend.Client, friend.Id, owner.Client, owner.Id);

            Assert.True((await ProfileAsync(friend, owner)).CanMessage);
        }

        [Fact]
        public async Task MessagesForNobody_AreRejected()
        {
            var owner = await AccountAsync("cm4a");

            var updated = await owner.Client.PutAsJsonAsync("/api/User/privacy", new
            {
                whoCanMessage = PrivacyLevel.Nobody,
                whoCanInvite = PrivacyLevel.Everyone,
                whoCanSeeProfile = PrivacyLevel.Everyone,
                whoCanSeeOnline = PrivacyLevel.Everyone
            });

            Assert.Equal(HttpStatusCode.BadRequest, updated.StatusCode);
        }

        [Fact]
        public async Task ClosedMessages_StayOpenInAnExistingChat()
        {
            var owner = await AccountAsync("cm5a");
            var partner = await AccountAsync("cm5b");
            await DirectChatWithAsync(partner.Client, owner.Name);
            await AcceptMessagesFromAsync(owner, PrivacyLevel.FriendsOnly);

            Assert.True((await ProfileAsync(partner, owner)).CanMessage);
        }

        [Fact]
        public async Task Blocking_ClosesMessagesEvenWhenTheyAreOpen()
        {
            var owner = await AccountAsync("cm6a");
            var blocked = await AccountAsync("cm6b");
            (await owner.Client.PostAsync($"/api/Block/{blocked.Id}", null)).EnsureSuccessStatusCode();

            Assert.False((await ProfileAsync(blocked, owner)).CanMessage);
        }

        [Fact]
        public async Task Search_CarriesTheSameAnswer()
        {
            var owner = await AccountAsync("cm7a");
            var stranger = await AccountAsync("cm7b");
            await AcceptMessagesFromAsync(owner, PrivacyLevel.FriendsOnly);

            var found = await stranger.Client.GetFromJsonAsync<List<UserDto>>(
                $"/api/User?searchTerm={owner.Name}&pageSize=20");

            Assert.False(found!.Single(u => u.Id == owner.Id).CanMessage);
        }
    }
}
