using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Entities.Models;
using Microsoft.Extensions.DependencyInjection;
using Services.DataTransferObjects;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class ChatPermissionApiTests : ApiTestBase
    {
        public ChatPermissionApiTests(VestyApiFactory factory) : base(factory) { }

        [Fact]
        public async Task Permissions_DefaultToTheSafeValues()
        {
            var ownerName = UniqueName("perma");
            var owner = await AuthenticatedClientAsync(ownerName);

            var chat = await CreateChatAsync(owner, "G" + ownerName);
            var fetched = await owner.GetFromJsonAsync<ChatDto>($"/api/Chat/{chat.Id}");

            Assert.Equal(ChatPermission.Admins, fetched!.WhoCanInvite);
            Assert.Equal(ChatPermission.Admins, fetched.WhoCanEdit);
            Assert.Equal(ChatPermission.Members, fetched.WhoCanPost);
        }

        [Fact]
        public async Task Permissions_OwnerCanCloseThePostingAndItStopsMembers()
        {
            var ownerName = UniqueName("locka");
            var memberName = UniqueName("lockb");
            var owner = await AuthenticatedClientAsync(ownerName);
            var member = await AuthenticatedClientAsync(memberName);
            var memberId = await UserIdAsync(owner, memberName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await FriendshipSetup.BefriendAsync(owner, ownerId, member, memberId);

            var chat = await CreateChatAsync(owner, "G" + ownerName);
            (await owner.PostAsJsonAsync($"/api/Chat/{chat.Id}/users",
                new { userId = memberId })).EnsureSuccessStatusCode();

            var before = await member.PostAsJsonAsync($"/api/Message/{chat.Id}/messages",
                new { content = "before" });
            Assert.Equal(HttpStatusCode.Created, before.StatusCode);

            var locked = await owner.PutAsJsonAsync($"/api/Chat/{chat.Id}/permissions",
                new
                {
                    whoCanInvite = ChatPermission.Admins,
                    whoCanEdit = ChatPermission.Admins,
                    whoCanPost = ChatPermission.Admins
                });
            Assert.Equal(HttpStatusCode.NoContent, locked.StatusCode);

            var after = await member.PostAsJsonAsync($"/api/Message/{chat.Id}/messages",
                new { content = "after" });
            Assert.Equal(HttpStatusCode.Forbidden, after.StatusCode);

            var byOwner = await owner.PostAsJsonAsync($"/api/Message/{chat.Id}/messages",
                new { content = "owner still can" });
            Assert.Equal(HttpStatusCode.Created, byOwner.StatusCode);
        }

        [Fact]
        public async Task Permissions_ClosedPostingAlsoStopsEditingOldMessages()
        {
            var ownerName = UniqueName("edta");
            var memberName = UniqueName("edtb");
            var owner = await AuthenticatedClientAsync(ownerName);
            var member = await AuthenticatedClientAsync(memberName);
            var memberId = await UserIdAsync(owner, memberName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await FriendshipSetup.BefriendAsync(owner, ownerId, member, memberId);

            var chat = await CreateChatAsync(owner, "G" + ownerName);
            (await owner.PostAsJsonAsync($"/api/Chat/{chat.Id}/users",
                new { userId = memberId })).EnsureSuccessStatusCode();

            var posted = await member.PostAsJsonAsync($"/api/Message/{chat.Id}/messages",
                new { content = "original" });
            posted.EnsureSuccessStatusCode();
            var message = await posted.Content.ReadFromJsonAsync<MessageDto>();
            Assert.NotNull(message);

            (await owner.PutAsJsonAsync($"/api/Chat/{chat.Id}/permissions",
                new
                {
                    whoCanInvite = ChatPermission.Admins,
                    whoCanEdit = ChatPermission.Admins,
                    whoCanPost = ChatPermission.Admins
                })).EnsureSuccessStatusCode();

            var edited = await member.PutAsJsonAsync(
                $"/api/Message/{chat.Id}/messages/{message!.Id}",
                new { content = "sneaked in after the lock" });
            Assert.Equal(HttpStatusCode.Forbidden, edited.StatusCode);

            var stored = await owner.GetFromJsonAsync<MessageDto>($"/api/Message/{message.Id}");
            Assert.Equal("original", stored!.Content);

            var byOwner = await owner.PostAsJsonAsync($"/api/Message/{chat.Id}/messages",
                new { content = "owner posts" });
            Assert.Equal(HttpStatusCode.Created, byOwner.StatusCode);
        }

        [Fact]
        public async Task Permissions_CannotEditALockedChatMessageThroughAnotherChat()
        {
            var ownerName = UniqueName("xcha");
            var memberName = UniqueName("xchb");
            var owner = await AuthenticatedClientAsync(ownerName);
            var member = await AuthenticatedClientAsync(memberName);
            var memberId = await UserIdAsync(owner, memberName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await FriendshipSetup.BefriendAsync(owner, ownerId, member, memberId);

            var locked = await CreateChatAsync(owner, "Locked " + ownerName);
            var open = await CreateChatAsync(owner, "Open " + ownerName);
            foreach (var chatId in new[] { locked.Id, open.Id })
                (await owner.PostAsJsonAsync($"/api/Chat/{chatId}/users",
                    new { userId = memberId })).EnsureSuccessStatusCode();

            var posted = await member.PostAsJsonAsync($"/api/Message/{locked.Id}/messages",
                new { content = "secret original" });
            posted.EnsureSuccessStatusCode();
            var message = await posted.Content.ReadFromJsonAsync<MessageDto>();
            Assert.NotNull(message);

            (await owner.PutAsJsonAsync($"/api/Chat/{locked.Id}/permissions",
                new
                {
                    whoCanInvite = ChatPermission.Admins,
                    whoCanEdit = ChatPermission.Admins,
                    whoCanPost = ChatPermission.Admins
                })).EnsureSuccessStatusCode();

            var throughOpenChat = await member.PutAsJsonAsync(
                $"/api/Message/{open.Id}/messages/{message!.Id}",
                new { content = "bypassed via another chat" });
            Assert.Equal(HttpStatusCode.NotFound, throughOpenChat.StatusCode);

            var stored = await owner.GetFromJsonAsync<MessageDto>($"/api/Message/{message.Id}");
            Assert.Equal("secret original", stored!.Content);
        }

        [Fact]
        public async Task Permissions_AnAdminCannotWidenThem()
        {
            var ownerName = UniqueName("wida");
            var adminName = UniqueName("widb");
            var owner = await AuthenticatedClientAsync(ownerName);
            var admin = await AuthenticatedClientAsync(adminName);
            var adminId = await UserIdAsync(owner, adminName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await FriendshipSetup.BefriendAsync(owner, ownerId, admin, adminId);

            var chat = await CreateChatAsync(owner, "G" + ownerName);
            (await owner.PostAsJsonAsync($"/api/Chat/{chat.Id}/users",
                new { userId = adminId })).EnsureSuccessStatusCode();
            (await owner.PatchAsJsonAsync($"/api/Chat/{chat.Id}/users/{adminId}/role",
                new { roleId = UserRole.Admin })).EnsureSuccessStatusCode();

            var attempt = await admin.PutAsJsonAsync($"/api/Chat/{chat.Id}/permissions",
                new
                {
                    whoCanInvite = ChatPermission.Members,
                    whoCanEdit = ChatPermission.Members,
                    whoCanPost = ChatPermission.Members
                });

            Assert.Equal(HttpStatusCode.Forbidden, attempt.StatusCode);
        }

        [Fact]
        public async Task Permissions_RejectAnUnknownLevel()
        {
            var ownerName = UniqueName("bada");
            var owner = await AuthenticatedClientAsync(ownerName);
            var chat = await CreateChatAsync(owner, "G" + ownerName);

            var attempt = await owner.PutAsJsonAsync($"/api/Chat/{chat.Id}/permissions",
                new { whoCanInvite = 99, whoCanEdit = 2, whoCanPost = 3 });

            Assert.Equal(HttpStatusCode.BadRequest, attempt.StatusCode);
        }

        [Fact]
        public async Task Description_IsSavedAndReturned()
        {
            var ownerName = UniqueName("desca");
            var owner = await AuthenticatedClientAsync(ownerName);
            var chat = await CreateChatAsync(owner, "G" + ownerName);

            var renamed = await owner.PutAsJsonAsync($"/api/Chat/{chat.Id}",
                new { name = "Renamed", description = "  Team standup notes  " });
            Assert.Equal(HttpStatusCode.NoContent, renamed.StatusCode);

            var fetched = await owner.GetFromJsonAsync<ChatDto>($"/api/Chat/{chat.Id}");
            Assert.Equal("Renamed", fetched!.Name);
            Assert.Equal("Team standup notes", fetched.Description);
        }
    }
}
