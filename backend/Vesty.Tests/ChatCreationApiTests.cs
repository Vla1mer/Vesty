using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Entities.Models;
using Microsoft.Extensions.DependencyInjection;
using Services.DataTransferObjects;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class ChatCreationApiTests : ApiTestBase
    {
        public ChatCreationApiTests(VestyApiFactory factory) : base(factory) { }

        [Fact]
        public async Task CreateChat_CannotPullInAUserWhoAllowsNoInvites()
        {
            var hostName = UniqueName("inva");
            var shyName = UniqueName("invb");
            var host = await AuthenticatedClientAsync(hostName);
            var shy = await AuthenticatedClientAsync(shyName);

            await SetWhoCanInviteAsync(shy, PrivacyLevel.Nobody);
            var shyId = await UserIdAsync(host, shyName);

            var created = await host.PostAsJsonAsync("/api/Chat",
                new { name = "G" + hostName, members = new[] { new { userId = shyId } } });

            Assert.Equal(HttpStatusCode.Forbidden, created.StatusCode);

            var shyChats = await shy.GetFromJsonAsync<List<ChatDto>>("/api/Chat");
            Assert.Empty(shyChats!);
        }

        [Fact]
        public async Task CreateChat_CannotPullInABlockedUser()
        {
            var hostName = UniqueName("blka");
            var otherName = UniqueName("blkb");
            var host = await AuthenticatedClientAsync(hostName);
            var other = await AuthenticatedClientAsync(otherName);

            var otherId = await UserIdAsync(host, otherName);
            var blocked = await host.PostAsync($"/api/Block/{otherId}", null);
            blocked.EnsureSuccessStatusCode();

            var created = await host.PostAsJsonAsync("/api/Chat",
                new { name = "G" + hostName, members = new[] { new { userId = otherId } } });

            Assert.Equal(HttpStatusCode.Forbidden, created.StatusCode);

            var otherChats = await other.GetFromJsonAsync<List<ChatDto>>("/api/Chat");
            Assert.Empty(otherChats!);
        }

        [Fact]
        public async Task CreateChat_RejectedInviteLeavesNoChatBehind()
        {
            var hostName = UniqueName("orpa");
            var shyName = UniqueName("orpb");
            var host = await AuthenticatedClientAsync(hostName);
            var shy = await AuthenticatedClientAsync(shyName);

            await SetWhoCanInviteAsync(shy, PrivacyLevel.Nobody);
            var shyId = await UserIdAsync(host, shyName);

            await host.PostAsJsonAsync("/api/Chat",
                new { name = "G" + hostName, members = new[] { new { userId = shyId } } });

            var hostChats = await host.GetFromJsonAsync<List<ChatDto>>("/api/Chat");
            Assert.Empty(hostChats!);
        }

        [Fact]
        public async Task CreateChat_WithTheSameMemberTwice_AddsThemOnce()
        {
            var hostName = UniqueName("dupa");
            var guestName = UniqueName("dupb");
            var host = await AuthenticatedClientAsync(hostName);
            var guest = await AuthenticatedClientAsync(guestName);

            var guestId = await UserIdAsync(host, guestName);
            var hostId = await UserIdAsync(host, hostName);
            await FriendshipSetup.BefriendAsync(host, hostId, guest, guestId);

            var created = await host.PostAsJsonAsync("/api/Chat",
                new
                {
                    name = "G" + hostName,
                    members = new[]
                    {
                        new { userId = guestId },
                        new { userId = guestId },
                        new { userId = hostId }
                    }
                });

            Assert.Equal(HttpStatusCode.Created, created.StatusCode);
            var chat = await created.Content.ReadFromJsonAsync<ChatDto>();

            var members = await host.GetFromJsonAsync<List<ChatMemberWithRoleDto>>(
                $"/api/Chat/{chat!.Id}/users");
            Assert.Equal(2, members!.Count);
            Assert.Equal(UserRole.Owner, members.Single(m => m.UserId == hostId).RoleId);
        }
    }
}
