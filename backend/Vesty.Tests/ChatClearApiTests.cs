using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Entities.Models;
using Microsoft.Extensions.DependencyInjection;
using Services.DataTransferObjects;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class ChatClearApiTests : ApiTestBase
    {
        public ChatClearApiTests(VestyApiFactory factory) : base(factory) { }

        [Fact]
        public async Task ClearForMe_HidesTheChatOnlyForTheCaller()
        {
            var aliceName = UniqueName("clra");
            var bobName = UniqueName("clrb");
            var alice = await AuthenticatedClientAsync(aliceName);
            var bob = await AuthenticatedClientAsync(bobName);

            var chatId = await DirectChatWithAsync(alice, bobName);
            await SendAsync(alice, chatId, "old one");
            await SendAsync(alice, chatId, "old two");

            var cleared = await alice.DeleteAsync($"/api/Chat/{chatId}/for-me");
            Assert.Equal(HttpStatusCode.NoContent, cleared.StatusCode);

            var aliceChats = await alice.GetFromJsonAsync<List<ChatDto>>("/api/Chat");
            var bobChats = await bob.GetFromJsonAsync<List<ChatDto>>("/api/Chat");
            Assert.DoesNotContain(aliceChats!, c => c.Id == chatId);
            Assert.Contains(bobChats!, c => c.Id == chatId);

            var aliceMessages = await alice.GetFromJsonAsync<List<MessageDto>>(
                $"/api/Chat/{chatId}/messages");
            var bobMessages = await bob.GetFromJsonAsync<List<MessageDto>>(
                $"/api/Chat/{chatId}/messages");
            Assert.Empty(aliceMessages!);
            Assert.Equal(2, bobMessages!.Count);
        }

        [Fact]
        public async Task ClearForMe_ChatReturnsWithNewMessagesOnly()
        {
            var aliceName = UniqueName("rtna");
            var bobName = UniqueName("rtnb");
            var alice = await AuthenticatedClientAsync(aliceName);
            var bob = await AuthenticatedClientAsync(bobName);

            var chatId = await DirectChatWithAsync(alice, bobName);
            await SendAsync(alice, chatId, "hidden one");
            await SendAsync(alice, chatId, "hidden two");
            await alice.DeleteAsync($"/api/Chat/{chatId}/for-me");

            await SendAsync(bob, chatId, "fresh");

            var aliceChats = await alice.GetFromJsonAsync<List<ChatDto>>("/api/Chat");
            var restored = Assert.Single(aliceChats!.Where(c => c.Id == chatId));

            Assert.Equal("fresh", restored.LastMessageContent);
            Assert.Equal(1, restored.UnreadCount);

            var aliceMessages = await alice.GetFromJsonAsync<List<MessageDto>>(
                $"/api/Chat/{chatId}/messages");
            Assert.Equal("fresh", Assert.Single(aliceMessages!).Content);
        }

        [Fact]
        public async Task ClearForMe_HidesOldMessagesFromSearchAndDirectFetch()
        {
            var aliceName = UniqueName("hida");
            var bobName = UniqueName("hidb");
            var alice = await AuthenticatedClientAsync(aliceName);
            var bob = await AuthenticatedClientAsync(bobName);

            var chatId = await DirectChatWithAsync(alice, bobName);
            await SendAsync(alice, chatId, "before clear");

            var before = await alice.GetFromJsonAsync<List<MessageDto>>(
                $"/api/Chat/{chatId}/messages");
            var oldId = Assert.Single(before!).Id;

            await alice.DeleteAsync($"/api/Chat/{chatId}/for-me");
            await SendAsync(bob, chatId, "after clear");

            var byId = await alice.GetAsync($"/api/Message/{oldId}");
            Assert.Equal(HttpStatusCode.NotFound, byId.StatusCode);

            var search = await alice.GetFromJsonAsync<List<MessageDto>>(
                $"/api/Message?chatId={chatId}");
            Assert.Equal("after clear", Assert.Single(search!).Content);

            var bobById = await bob.GetAsync($"/api/Message/{oldId}");
            Assert.Equal(HttpStatusCode.OK, bobById.StatusCode);
        }

        [Fact]
        public async Task ClearForMe_OnGroupChat_IsRejected()
        {
            var ownerName = UniqueName("grpo");
            var owner = await AuthenticatedClientAsync(ownerName);

            var created = await owner.PostAsJsonAsync("/api/Chat",
                new { name = "Group " + ownerName, members = Array.Empty<object>() });
            created.EnsureSuccessStatusCode();
            var chat = await created.Content.ReadFromJsonAsync<ChatDto>();

            var cleared = await owner.DeleteAsync($"/api/Chat/{chat!.Id}/for-me");
            Assert.Equal(HttpStatusCode.BadRequest, cleared.StatusCode);

            var chats = await owner.GetFromJsonAsync<List<ChatDto>>("/api/Chat");
            Assert.Contains(chats!, c => c.Id == chat.Id);
        }
    }
}
