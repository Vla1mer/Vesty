using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Entities.Models;
using Services.DataTransferObjects;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class ChatInviteApiTests
    {
        private readonly VestyApiFactory _factory;

        public ChatInviteApiTests(VestyApiFactory factory) => _factory = factory;

        private static string UniqueName(string prefix) =>
            $"{prefix}{Guid.NewGuid():N}"[..20];

        private async Task<HttpClient> AuthenticatedClientAsync(string userName)
        {
            var client = _factory.CreateClient();
            (await client.PostAsJsonAsync("/api/User/register",
                new { userName, password = "Test123" })).EnsureSuccessStatusCode();
            var login = await client.PostAsJsonAsync("/api/User/login",
                new { userName, password = "Test123" });
            login.EnsureSuccessStatusCode();
            var tokens = await login.Content.ReadFromJsonAsync<TokenDto>();
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", tokens!.AccessToken);
            return client;
        }

        private static async Task<int> UserIdAsync(HttpClient client, string userName)
        {
            var found = await client.GetFromJsonAsync<List<UserDto>>(
                $"/api/User?searchTerm={userName}&pageSize=20");
            return found!.Single(u => u.UserName == userName).Id;
        }

        private static async Task<ChatDto> CreateChatAsync(HttpClient client, string name)
        {
            var created = await client.PostAsJsonAsync("/api/Chat", new { name });
            created.EnsureSuccessStatusCode();
            return (await created.Content.ReadFromJsonAsync<ChatDto>())!;
        }

        private static async Task<string> CreateInviteAsync(HttpClient client, int chatId)
        {
            var created = await client.PostAsJsonAsync($"/api/Chat/{chatId}/invite",
                new { expiresInDays = (int?)null });
            Assert.Equal(HttpStatusCode.Created, created.StatusCode);
            var invite = await created.Content.ReadFromJsonAsync<ChatInviteDto>();
            return invite!.Code;
        }

        [Fact]
        public async Task NewUser_DefaultsToFriendsOnlyGroupInvites()
        {
            var user = await AuthenticatedClientAsync(UniqueName("dflt1"));

            var privacy = await user.GetFromJsonAsync<PrivacySettingsDto>("/api/User/privacy");

            Assert.Equal(PrivacyLevel.FriendsOnly, privacy!.WhoCanInvite);
            Assert.Equal(PrivacyLevel.Everyone, privacy.WhoCanMessage);
        }

        [Fact]
        public async Task AStranger_CannotAddYouToAGroupByDefault()
        {
            var host = await AuthenticatedClientAsync(UniqueName("strg1"));
            var targetName = UniqueName("strg2");
            await AuthenticatedClientAsync(targetName);
            var targetId = await UserIdAsync(host, targetName);

            var chat = await CreateChatAsync(host, "Strangers");
            var added = await host.PostAsJsonAsync($"/api/Chat/{chat.Id}/users",
                new { userId = targetId });

            Assert.Equal(HttpStatusCode.Forbidden, added.StatusCode);
        }

        [Fact]
        public async Task AFriend_CanStillAddYouToAGroup()
        {
            var hostName = UniqueName("frnd1");
            var targetName = UniqueName("frnd2");
            var host = await AuthenticatedClientAsync(hostName);
            var target = await AuthenticatedClientAsync(targetName);
            var hostId = await UserIdAsync(target, hostName);
            var targetId = await UserIdAsync(host, targetName);

            (await host.PostAsync($"/api/Friend/{targetId}", null)).EnsureSuccessStatusCode();
            (await target.PostAsync($"/api/Friend/{hostId}/accept", null)).EnsureSuccessStatusCode();

            var chat = await CreateChatAsync(host, "Friends");
            var added = await host.PostAsJsonAsync($"/api/Chat/{chat.Id}/users",
                new { userId = targetId });

            Assert.Equal(HttpStatusCode.Created, added.StatusCode);
        }

        [Fact]
        public async Task AStrangerCanStillBeReachedByAnInviteLink()
        {
            var host = await AuthenticatedClientAsync(UniqueName("lnkd1"));
            var stranger = await AuthenticatedClientAsync(UniqueName("lnkd2"));

            var chat = await CreateChatAsync(host, "Link beats privacy");
            var code = await CreateInviteAsync(host, chat.Id);

            var joined = await stranger.PostAsync($"/api/Chat/invite/{code}/join", null);

            Assert.Equal(HttpStatusCode.OK, joined.StatusCode);
        }

        [Fact]
        public async Task JoinByLink_AddsTheUserAsAPlainMember()
        {
            var owner = await AuthenticatedClientAsync(UniqueName("inv1a"));
            var guestName = UniqueName("inv1b");
            var guest = await AuthenticatedClientAsync(guestName);
            var guestId = await UserIdAsync(owner, guestName);

            var chat = await CreateChatAsync(owner, "Linked");
            var code = await CreateInviteAsync(owner, chat.Id);

            var joined = await guest.PostAsync($"/api/Chat/invite/{code}/join", null);
            Assert.Equal(HttpStatusCode.OK, joined.StatusCode);

            var members = await owner.GetFromJsonAsync<List<ChatMemberWithRoleDto>>(
                $"/api/Chat/{chat.Id}/users");
            Assert.Equal(UserRole.User, members!.Single(m => m.UserId == guestId).RoleId);

            var guestChats = await guest.GetFromJsonAsync<List<ChatDto>>("/api/Chat");
            Assert.Contains(guestChats!, c => c.Id == chat.Id);
        }

        [Fact]
        public async Task JoinByLink_WorksEvenWhenTheUserAllowsNoInvites()
        {
            var owner = await AuthenticatedClientAsync(UniqueName("inv2a"));
            var shy = await AuthenticatedClientAsync(UniqueName("inv2b"));
            (await shy.PutAsJsonAsync("/api/User/privacy",
                new { whoCanMessage = 1, whoCanInvite = PrivacyLevel.Nobody }))
                .EnsureSuccessStatusCode();

            var chat = await CreateChatAsync(owner, "Open");
            var code = await CreateInviteAsync(owner, chat.Id);

            var joined = await shy.PostAsync($"/api/Chat/invite/{code}/join", null);

            Assert.Equal(HttpStatusCode.OK, joined.StatusCode);
        }

        [Fact]
        public async Task JoinByLink_TwiceIsHarmless()
        {
            var owner = await AuthenticatedClientAsync(UniqueName("inv3a"));
            var guestName = UniqueName("inv3b");
            var guest = await AuthenticatedClientAsync(guestName);
            var guestId = await UserIdAsync(owner, guestName);

            var chat = await CreateChatAsync(owner, "Twice");
            var code = await CreateInviteAsync(owner, chat.Id);

            await guest.PostAsync($"/api/Chat/invite/{code}/join", null);
            var second = await guest.PostAsync($"/api/Chat/invite/{code}/join", null);
            Assert.Equal(HttpStatusCode.OK, second.StatusCode);

            var members = await owner.GetFromJsonAsync<List<ChatMemberWithRoleDto>>(
                $"/api/Chat/{chat.Id}/users");
            Assert.Single(members!, m => m.UserId == guestId);
        }

        [Fact]
        public async Task JoinByLink_ConcurrentlyStillAddsOneMembership()
        {
            var owner = await AuthenticatedClientAsync(UniqueName("inv11a"));
            var guestName = UniqueName("inv11b");
            var guest = await AuthenticatedClientAsync(guestName);
            var guestId = await UserIdAsync(owner, guestName);

            var chat = await CreateChatAsync(owner, "Race");
            var code = await CreateInviteAsync(owner, chat.Id);

            var start = new TaskCompletionSource();
            var attempts = Enumerable.Range(0, 4).Select(async _ =>
            {
                await start.Task;
                return await guest.PostAsync($"/api/Chat/invite/{code}/join", null);
            }).ToList();

            start.SetResult();
            var responses = await Task.WhenAll(attempts);

            Assert.All(responses, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));

            var members = await owner.GetFromJsonAsync<List<ChatMemberWithRoleDto>>(
                $"/api/Chat/{chat.Id}/users");
            Assert.Single(members!, m => m.UserId == guestId);
        }

        [Fact]
        public async Task RevokedLink_StopsWorking()
        {
            var owner = await AuthenticatedClientAsync(UniqueName("inv4a"));
            var guest = await AuthenticatedClientAsync(UniqueName("inv4b"));

            var chat = await CreateChatAsync(owner, "Revoked");
            var code = await CreateInviteAsync(owner, chat.Id);

            var revoked = await owner.DeleteAsync($"/api/Chat/{chat.Id}/invite");
            Assert.Equal(HttpStatusCode.NoContent, revoked.StatusCode);

            var joined = await guest.PostAsync($"/api/Chat/invite/{code}/join", null);
            Assert.Equal(HttpStatusCode.NotFound, joined.StatusCode);
        }

        [Fact]
        public async Task CreatingANewLink_RevokesThePreviousOne()
        {
            var owner = await AuthenticatedClientAsync(UniqueName("inv5a"));
            var guest = await AuthenticatedClientAsync(UniqueName("inv5b"));

            var chat = await CreateChatAsync(owner, "Rotated");
            var first = await CreateInviteAsync(owner, chat.Id);
            var second = await CreateInviteAsync(owner, chat.Id);

            Assert.NotEqual(first, second);

            var withOld = await guest.PostAsync($"/api/Chat/invite/{first}/join", null);
            Assert.Equal(HttpStatusCode.NotFound, withOld.StatusCode);

            var withNew = await guest.PostAsync($"/api/Chat/invite/{second}/join", null);
            Assert.Equal(HttpStatusCode.OK, withNew.StatusCode);
        }

        [Fact]
        public async Task PlainMember_CannotCreateALinkWhenInvitesAreAdminsOnly()
        {
            var ownerName = UniqueName("inv6a");
            var owner = await AuthenticatedClientAsync(ownerName);
            var memberName = UniqueName("inv6b");
            var member = await AuthenticatedClientAsync(memberName);
            var memberId = await UserIdAsync(owner, memberName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await FriendshipSetup.BefriendAsync(owner, ownerId, member, memberId);

            var chat = await CreateChatAsync(owner, "Guarded");
            (await owner.PostAsJsonAsync($"/api/Chat/{chat.Id}/users", new { userId = memberId }))
                .EnsureSuccessStatusCode();

            var attempt = await member.PostAsJsonAsync($"/api/Chat/{chat.Id}/invite",
                new { expiresInDays = (int?)null });
            Assert.Equal(HttpStatusCode.Forbidden, attempt.StatusCode);
        }

        [Fact]
        public async Task PlainMember_CanCreateALinkWhenInvitesAreOpen()
        {
            var ownerName = UniqueName("inv7a");
            var owner = await AuthenticatedClientAsync(ownerName);
            var memberName = UniqueName("inv7b");
            var member = await AuthenticatedClientAsync(memberName);
            var memberId = await UserIdAsync(owner, memberName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await FriendshipSetup.BefriendAsync(owner, ownerId, member, memberId);

            var chat = await CreateChatAsync(owner, "Open invites");
            (await owner.PostAsJsonAsync($"/api/Chat/{chat.Id}/users", new { userId = memberId }))
                .EnsureSuccessStatusCode();
            (await owner.PutAsJsonAsync($"/api/Chat/{chat.Id}/permissions",
                new
                {
                    whoCanInvite = ChatPermission.Members,
                    whoCanEdit = ChatPermission.Admins,
                    whoCanPost = ChatPermission.Members
                })).EnsureSuccessStatusCode();

            var created = await member.PostAsJsonAsync($"/api/Chat/{chat.Id}/invite",
                new { expiresInDays = (int?)null });
            Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        }

        [Fact]
        public async Task Preview_DescribesTheChatWithoutJoining()
        {
            var owner = await AuthenticatedClientAsync(UniqueName("inv8a"));
            var guest = await AuthenticatedClientAsync(UniqueName("inv8b"));

            var chat = await CreateChatAsync(owner, "Preview me");
            (await owner.PutAsJsonAsync($"/api/Chat/{chat.Id}",
                new { name = "Preview me", description = "A cosy place" })).EnsureSuccessStatusCode();
            var code = await CreateInviteAsync(owner, chat.Id);

            var preview = await guest.GetFromJsonAsync<ChatInvitePreviewDto>(
                $"/api/Chat/invite/{code}");

            Assert.Equal("Preview me", preview!.Name);
            Assert.Equal("A cosy place", preview.Description);
            Assert.Equal(1, preview.MemberCount);
            Assert.False(preview.AlreadyMember);

            var guestChats = await guest.GetFromJsonAsync<List<ChatDto>>("/api/Chat");
            Assert.DoesNotContain(guestChats!, c => c.Id == chat.Id);
        }

        [Fact]
        public async Task ExpiredLink_IsRejected()
        {
            var owner = await AuthenticatedClientAsync(UniqueName("inv9a"));

            var chat = await CreateChatAsync(owner, "Bad expiry");
            var attempt = await owner.PostAsJsonAsync($"/api/Chat/{chat.Id}/invite",
                new { expiresInDays = 0 });

            Assert.Equal(HttpStatusCode.BadRequest, attempt.StatusCode);
        }

        [Fact]
        public async Task UnknownCode_IsRejected()
        {
            var guest = await AuthenticatedClientAsync(UniqueName("inv10"));

            var joined = await guest.PostAsync("/api/Chat/invite/does-not-exist/join", null);

            Assert.Equal(HttpStatusCode.NotFound, joined.StatusCode);
        }
    }
}
