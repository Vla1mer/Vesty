using System.Net.Http.Json;
using Entities.Models;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class PresenceVisibilityApiTests : ApiTestBase
    {
        public PresenceVisibilityApiTests(VestyApiFactory factory) : base(factory)
        {
        }

        private sealed record OnlineUser(HttpClient Client, int Id, HubConnection Hub)
            : IAsyncDisposable
        {
            public ValueTask DisposeAsync() => Hub.DisposeAsync();
        }

        private IPresenceTracker Presence =>
            Factory.Services.GetRequiredService<IPresenceTracker>();

        private static async Task<UserPresenceDto> PresenceOfAsync(HttpClient client, int userId)
        {
            var found = await client.GetFromJsonAsync<List<UserPresenceDto>>(
                $"/api/User/presence/({userId})");
            return found!.Single(p => p.UserId == userId);
        }

        private static async Task SetOnlineVisibilityAsync(HttpClient client, int level) =>
            await SetPrivacyAsync(client, PrivacyLevel.Everyone, PrivacyLevel.Everyone,
                PrivacyLevel.Everyone, level);

        private async Task<OnlineUser> OnlineUserAsync(string prefix)
        {
            var name = UniqueName(prefix);
            var client = await AuthenticatedClientAsync(name);
            var id = await UserIdAsync(client, name);

            var hub = HubFor(client);
            await hub.StartAsync();
            await WaitUntil(() => Presence.IsOnline(id), $"{prefix} shows as online");

            return new OnlineUser(client, id, hub);
        }

        [Fact]
        public async Task AnOpenUser_IsSeenAsOnline()
        {
            await using var owner = await OnlineUserAsync("onl1a");
            var stranger = await AuthenticatedClientAsync(UniqueName("onl1b"));

            var presence = await PresenceOfAsync(stranger, owner.Id);

            Assert.True(presence.IsOnline);
        }

        [Fact]
        public async Task AUserOpenToNobody_LooksOffline()
        {
            await using var owner = await OnlineUserAsync("onl2a");
            await SetOnlineVisibilityAsync(owner.Client, PrivacyLevel.Nobody);
            var stranger = await AuthenticatedClientAsync(UniqueName("onl2b"));

            var presence = await PresenceOfAsync(stranger, owner.Id);

            Assert.False(presence.IsOnline);
            Assert.Null(presence.LastSeenAt);
        }

        [Fact]
        public async Task AUserOpenToFriends_IsSeenByAFriend()
        {
            await using var owner = await OnlineUserAsync("onl3a");
            var friendName = UniqueName("onl3b");
            var friend = await AuthenticatedClientAsync(friendName);
            var friendId = await UserIdAsync(owner.Client, friendName);

            await FriendshipSetup.BefriendAsync(friend, friendId, owner.Client, owner.Id);
            await SetOnlineVisibilityAsync(owner.Client, PrivacyLevel.FriendsOnly);

            var presence = await PresenceOfAsync(friend, owner.Id);

            Assert.True(presence.IsOnline);
        }

        [Fact]
        public async Task AUserOpenToFriends_LooksOfflineToAStranger()
        {
            await using var owner = await OnlineUserAsync("onl4a");
            await SetOnlineVisibilityAsync(owner.Client, PrivacyLevel.FriendsOnly);
            var stranger = await AuthenticatedClientAsync(UniqueName("onl4b"));

            var presence = await PresenceOfAsync(stranger, owner.Id);

            Assert.False(presence.IsOnline);
        }

        [Fact]
        public async Task ABlockedUser_LooksOffline()
        {
            await using var owner = await OnlineUserAsync("onl5a");
            var blockedName = UniqueName("onl5b");
            var blocked = await AuthenticatedClientAsync(blockedName);
            var blockedId = await UserIdAsync(owner.Client, blockedName);

            (await owner.Client.PostAsync($"/api/Block/{blockedId}", null))
                .EnsureSuccessStatusCode();

            var presence = await PresenceOfAsync(blocked, owner.Id);

            Assert.False(presence.IsOnline);
        }

        [Fact]
        public async Task YourOwnStatus_IsAlwaysVisibleToYou()
        {
            await using var owner = await OnlineUserAsync("onl6");
            await SetOnlineVisibilityAsync(owner.Client, PrivacyLevel.Nobody);

            var presence = await PresenceOfAsync(owner.Client, owner.Id);

            Assert.True(presence.IsOnline);
        }

        [Fact]
        public async Task AUserWhoLeft_ShowsWhenTheyWereLastSeen()
        {
            var owner = await OnlineUserAsync("onl7a");
            await owner.Hub.StopAsync();
            await owner.DisposeAsync();
            await WaitUntil(() => !Presence.IsOnline(owner.Id), "the user shows as offline");

            var stranger = await AuthenticatedClientAsync(UniqueName("onl7b"));
            var presence = await PresenceOfAsync(stranger, owner.Id);

            Assert.False(presence.IsOnline);
            Assert.NotNull(presence.LastSeenAt);
        }

        [Fact]
        public async Task AskingForSeveralAtOnce_AnswersForEach()
        {
            await using var online = await OnlineUserAsync("onl8a");
            var offlineName = UniqueName("onl8b");
            await AuthenticatedClientAsync(offlineName);

            var asker = await AuthenticatedClientAsync(UniqueName("onl8c"));
            var offlineId = await UserIdAsync(asker, offlineName);

            var found = await asker.GetFromJsonAsync<List<UserPresenceDto>>(
                $"/api/User/presence/({online.Id},{offlineId})");

            Assert.Equal(2, found!.Count);
            Assert.True(found.Single(p => p.UserId == online.Id).IsOnline);
            Assert.False(found.Single(p => p.UserId == offlineId).IsOnline);
        }
    }
}
