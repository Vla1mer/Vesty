using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Entities.Models;
using Microsoft.Extensions.DependencyInjection;
using Services.DataTransferObjects;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class MessageApiTests : ApiTestBase
    {
        public MessageApiTests(VestyApiFactory factory) : base(factory) { }

        [Fact]
        public async Task SendMessage_ThenRead_ReturnsSameText()
        {
            var client = await AuthenticatedClientAsync(UniqueName("msg"));
            var chat = await CreateChatAsync(client, "Integration chat");
            const string text = "Привет из интеграционного теста";

            var sent = await client.PostAsJsonAsync(
                $"/api/Message/{chat.Id}/messages", new { content = text });
            Assert.Equal(HttpStatusCode.Created, sent.StatusCode);

            var messages = await client.GetFromJsonAsync<List<MessageDto>>(
                $"/api/Chat/{chat.Id}/messages");

            Assert.Single(messages!);
            Assert.Equal(text, messages![0].Content);
        }

        [Fact]
        public async Task Reply_KeepsQuoteAfterEdit()
        {
            var client = await AuthenticatedClientAsync(UniqueName("reply"));
            var chat = await CreateChatAsync(client, "Reply chat");

            var original = await (await client.PostAsJsonAsync(
                $"/api/Message/{chat.Id}/messages", new { content = "Оригинал" }))
                .Content.ReadFromJsonAsync<MessageDto>();

            var reply = await (await client.PostAsJsonAsync(
                $"/api/Message/{chat.Id}/messages",
                new { content = "Ответ", replyToMessageId = original!.Id }))
                .Content.ReadFromJsonAsync<MessageDto>();

            await client.PutAsJsonAsync(
                $"/api/Message/{chat.Id}/messages/{reply!.Id}", new { content = "Изменённый ответ" });

            var messages = await client.GetFromJsonAsync<List<MessageDto>>(
                $"/api/Chat/{chat.Id}/messages");
            var edited = messages!.Single(m => m.Id == reply.Id);

            Assert.Equal("Изменённый ответ", edited.Content);
            Assert.True(edited.IsEdited);
            Assert.NotNull(edited.ReplyTo);
            Assert.Equal(original.Id, edited.ReplyTo!.Id);
        }

        [Fact]
        public async Task Reactions_AreToggledPerUser()
        {
            var client = await AuthenticatedClientAsync(UniqueName("react"));
            var chat = await CreateChatAsync(client, "Reaction chat");
            var message = await (await client.PostAsJsonAsync(
                $"/api/Message/{chat.Id}/messages", new { content = "React to me" }))
                .Content.ReadFromJsonAsync<MessageDto>();

            await client.PostAsJsonAsync($"/api/Message/{message!.Id}/reactions", new { emoji = "🔥" });
            var afterAdd = await client.GetFromJsonAsync<List<MessageDto>>(
                $"/api/Chat/{chat.Id}/messages");

            await client.DeleteAsync($"/api/Message/{message.Id}/reactions/{Uri.EscapeDataString("🔥")}");
            var afterRemove = await client.GetFromJsonAsync<List<MessageDto>>(
                $"/api/Chat/{chat.Id}/messages");

            Assert.Single(afterAdd!.Single(m => m.Id == message.Id).Reactions);
            Assert.Empty(afterRemove!.Single(m => m.Id == message.Id).Reactions);
        }

        [Fact]
        public async Task ForeignUser_CannotReadChat()
        {
            var owner = await AuthenticatedClientAsync(UniqueName("owner"));
            var chat = await CreateChatAsync(owner, "Private stuff");

            var outsider = await AuthenticatedClientAsync(UniqueName("outsider"));
            var response = await outsider.GetAsync($"/api/Chat/{chat.Id}/messages");

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task MessageContent_IsEncryptedInDatabase()
        {
            var client = await AuthenticatedClientAsync(UniqueName("crypt"));
            var chat = await CreateChatAsync(client, "Encryption chat");
            const string secret = "This must not be stored as plain text";

            await client.PostAsJsonAsync($"/api/Message/{chat.Id}/messages", new { content = secret });

            using var scope = Factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<Repository.AppDbContext>();
            var stored = context.Messages.Single(m => m.ChatId == chat.Id).Content;

            Assert.DoesNotContain(secret, stored);
        }
    }
}
