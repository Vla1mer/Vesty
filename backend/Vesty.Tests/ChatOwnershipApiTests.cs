using System.Net;
using System.Net.Http.Json;
using Entities.Models;
using Services.DataTransferObjects;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class ChatOwnershipApiTests : ApiTestBase
    {
        public ChatOwnershipApiTests(VestyApiFactory factory) : base(factory) { }

        [Fact]
        public async Task TransferOwnership_LetsTheFormerOwnerLeave()
        {
            var ownerName = UniqueName("towna");
            var heirName = UniqueName("townb");
            var owner = await AuthenticatedClientAsync(ownerName);
            var heir = await AuthenticatedClientAsync(heirName);

            var ownerId = await UserIdAsync(owner, ownerName);
            var heirId = await UserIdAsync(owner, heirName);
            await FriendshipSetup.BefriendAsync(owner, ownerId, heir, heirId);

            var chat = await CreateChatAsync(owner, "Group " + ownerName);
            var added = await owner.PostAsJsonAsync($"/api/Chat/{chat.Id}/users",
                new { userId = heirId });
            added.EnsureSuccessStatusCode();

            var earlyLeave = await owner.DeleteAsync($"/api/Chat/{chat.Id}/users/{ownerId}");
            Assert.Equal(HttpStatusCode.BadRequest, earlyLeave.StatusCode);

            var transfer = await owner.PostAsync($"/api/Chat/{chat.Id}/users/{heirId}/owner", null);
            Assert.Equal(HttpStatusCode.NoContent, transfer.StatusCode);

            var members = await heir.GetFromJsonAsync<List<ChatMemberWithRoleDto>>(
                $"/api/Chat/{chat.Id}/users");
            Assert.Equal(UserRole.Owner, members!.Single(m => m.UserId == heirId).RoleId);
            Assert.Equal(UserRole.Admin, members!.Single(m => m.UserId == ownerId).RoleId);

            var leave = await owner.DeleteAsync($"/api/Chat/{chat.Id}/users/{ownerId}");
            Assert.Equal(HttpStatusCode.NoContent, leave.StatusCode);

            var ownerChats = await owner.GetFromJsonAsync<List<ChatDto>>("/api/Chat");
            Assert.DoesNotContain(ownerChats!, c => c.Id == chat.Id);

            var heirChats = await heir.GetFromJsonAsync<List<ChatDto>>("/api/Chat");
            Assert.Contains(heirChats!, c => c.Id == chat.Id);
        }

        [Fact]
        public async Task TransferOwnership_ByANonOwner_IsForbidden()
        {
            var ownerName = UniqueName("nowna");
            var memberName = UniqueName("nownb");
            var owner = await AuthenticatedClientAsync(ownerName);
            var member = await AuthenticatedClientAsync(memberName);

            var memberId = await UserIdAsync(owner, memberName);
            var ownerId = await UserIdAsync(owner, ownerName);
            await FriendshipSetup.BefriendAsync(owner, ownerId, member, memberId);

            var chat = await CreateChatAsync(owner, "Group " + ownerName);
            var added = await owner.PostAsJsonAsync($"/api/Chat/{chat.Id}/users",
                new { userId = memberId });
            added.EnsureSuccessStatusCode();

            var transfer = await member.PostAsync($"/api/Chat/{chat.Id}/users/{memberId}/owner", null);
            Assert.Equal(HttpStatusCode.Forbidden, transfer.StatusCode);
        }

        [Fact]
        public async Task TransferOwnership_RunTwiceAtOnce_LeavesOneOwner()
        {
            var ownerName = UniqueName("racea");
            var owner = await AuthenticatedClientAsync(ownerName);
            var ownerId = await UserIdAsync(owner, ownerName);

            var chat = await CreateChatAsync(owner, "Race " + ownerName);

            var candidateIds = new List<int>();
            HttpClient? firstCandidate = null;
            for (var i = 0; i < 4; i++)
            {
                var name = UniqueName($"racec{i}");
                var client = await AuthenticatedClientAsync(name);
                firstCandidate ??= client;

                var id = await UserIdAsync(owner, name);
                await FriendshipSetup.BefriendAsync(owner, ownerId, client, id);

                var added = await owner.PostAsJsonAsync($"/api/Chat/{chat.Id}/users",
                    new { userId = id });
                added.EnsureSuccessStatusCode();
                candidateIds.Add(id);
            }

            var start = new TaskCompletionSource();
            var attempts = candidateIds.Select(async id =>
            {
                await start.Task;
                return await owner.PostAsync($"/api/Chat/{chat.Id}/users/{id}/owner", null);
            }).ToList();

            start.SetResult();
            var responses = await Task.WhenAll(attempts);

            Assert.Single(responses, r => r.StatusCode == HttpStatusCode.NoContent);

            var members = await firstCandidate!.GetFromJsonAsync<List<ChatMemberWithRoleDto>>(
                $"/api/Chat/{chat.Id}/users");
            Assert.Single(members!, m => m.RoleId == UserRole.Owner);
        }
    }
}
