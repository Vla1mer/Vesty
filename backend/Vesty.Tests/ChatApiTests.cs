using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Services.DataTransferObjects;

namespace Vesty.Tests
{
    public class ChatApiTests : IClassFixture<VestyApiFactory>
    {
        private readonly VestyApiFactory _factory;

        public ChatApiTests(VestyApiFactory factory)
        {
            _factory = factory;
        }

        private static string UniqueName(string prefix) =>
            $"{prefix}{Guid.NewGuid():N}"[..20];

        private async Task<HttpClient> AuthenticatedClientAsync(string userName)
        {
            var client = _factory.CreateClient();

            var register = await client.PostAsJsonAsync("/api/User/register",
                new { userName, password = "Test123" });
            Assert.Equal(HttpStatusCode.Created, register.StatusCode);

            var login = await client.PostAsJsonAsync("/api/User/login",
                new { userName, password = "Test123" });
            login.EnsureSuccessStatusCode();

            var tokens = await login.Content.ReadFromJsonAsync<TokenDto>();
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", tokens!.AccessToken);

            return client;
        }

        private static async Task<ChatDto> CreateChatAsync(HttpClient client, string name)
        {
            var response = await client.PostAsJsonAsync("/api/Chat", new { name });
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            return (await response.Content.ReadFromJsonAsync<ChatDto>())!;
        }

        [Fact]
        public async Task Register_ThenLogin_ReturnsTokens()
        {
            var client = _factory.CreateClient();
            var userName = UniqueName("flow");

            var register = await client.PostAsJsonAsync("/api/User/register",
                new { userName, password = "Test123" });
            var login = await client.PostAsJsonAsync("/api/User/login",
                new { userName, password = "Test123" });
            var tokens = await login.Content.ReadFromJsonAsync<TokenDto>();

            Assert.Equal(HttpStatusCode.Created, register.StatusCode);
            Assert.Equal(HttpStatusCode.OK, login.StatusCode);
            Assert.False(string.IsNullOrWhiteSpace(tokens!.AccessToken));
        }

        [Fact]
        public async Task Login_WithWrongPassword_IsUnauthorized()
        {
            var client = _factory.CreateClient();
            var userName = UniqueName("wrongpw");
            await client.PostAsJsonAsync("/api/User/register", new { userName, password = "Test123" });

            var login = await client.PostAsJsonAsync("/api/User/login",
                new { userName, password = "WrongPassword1" });

            Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
        }

        [Fact]
        public async Task Chat_WithoutToken_IsUnauthorized()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/Chat");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

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

            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<Repository.AppDbContext>();
            var stored = context.Messages.Single(m => m.ChatId == chat.Id).Content;

            Assert.DoesNotContain(secret, stored);
        }
    
        private static MultipartFormDataContent FileForm(string name, byte[] bytes, string contentType)
        {
            var content = new ByteArrayContent(bytes);
            content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
            return new MultipartFormDataContent { { content, "file", name } };
        }

        [Fact]
        public async Task Attachment_UploadSendDownload_RoundTrips()
        {
            var client = await AuthenticatedClientAsync(UniqueName("att"));
            var chat = await CreateChatAsync(client, "Attachment chat");
            var payload = System.Text.Encoding.UTF8.GetBytes("Содержимое вложения");

            var upload = await client.PostAsync($"/api/Message/{chat.Id}/attachments",
                FileForm("notes.txt", payload, "text/plain"));
            Assert.Equal(HttpStatusCode.Created, upload.StatusCode);
            var attachment = await upload.Content.ReadFromJsonAsync<MessageAttachmentDto>();

            var sent = await client.PostAsJsonAsync($"/api/Message/{chat.Id}/messages",
                new { content = "Файл внутри", attachmentIds = new[] { attachment!.Id } });
            Assert.Equal(HttpStatusCode.Created, sent.StatusCode);

            var messages = await client.GetFromJsonAsync<List<MessageDto>>($"/api/Chat/{chat.Id}/messages");
            var stored = Assert.Single(messages!).Attachments;
            Assert.Equal("notes.txt", Assert.Single(stored).FileName);

            var download = await client.GetAsync($"/api/Message/attachments/{attachment.Id}");
            download.EnsureSuccessStatusCode();
            Assert.Equal(payload, await download.Content.ReadAsByteArrayAsync());
        }

        [Fact]
        public async Task Attachment_ExecutableFile_IsRejected()
        {
            var client = await AuthenticatedClientAsync(UniqueName("exe"));
            var chat = await CreateChatAsync(client, "Exe chat");

            var upload = await client.PostAsync($"/api/Message/{chat.Id}/attachments",
                FileForm("virus.exe", new byte[] { 1, 2, 3 }, "application/octet-stream"));

            Assert.Equal(HttpStatusCode.BadRequest, upload.StatusCode);
        }

        [Fact]
        public async Task Attachment_ForForeignChat_IsForbidden()
        {
            var owner = await AuthenticatedClientAsync(UniqueName("attown"));
            var chat = await CreateChatAsync(owner, "Closed chat");

            var outsider = await AuthenticatedClientAsync(UniqueName("attout"));
            var upload = await outsider.PostAsync($"/api/Message/{chat.Id}/attachments",
                FileForm("note.txt", new byte[] { 1 }, "text/plain"));

            Assert.Equal(HttpStatusCode.Forbidden, upload.StatusCode);
        }

        [Fact]
        public async Task Attachment_CannotBeReusedByAnotherUser()
        {
            var first = await AuthenticatedClientAsync(UniqueName("attmine"));
            var chat = await CreateChatAsync(first, "Shared chat");
            var upload = await first.PostAsync($"/api/Message/{chat.Id}/attachments",
                FileForm("mine.txt", new byte[] { 7 }, "text/plain"));
            var attachment = await upload.Content.ReadFromJsonAsync<MessageAttachmentDto>();

            var second = await AuthenticatedClientAsync(UniqueName("attthief"));
            var ownChat = await CreateChatAsync(second, "Thief chat");
            var stolen = await second.PostAsJsonAsync($"/api/Message/{ownChat.Id}/messages",
                new { content = "Чужое вложение", attachmentIds = new[] { attachment!.Id } });

            Assert.Equal(HttpStatusCode.BadRequest, stolen.StatusCode);
        }
}
}
