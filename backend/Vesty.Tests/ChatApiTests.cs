using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Entities.Models;
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

        [Fact]
        public async Task Attachment_KeepsCyrillicFileName()
        {
            var client = await AuthenticatedClientAsync(UniqueName("cyr"));
            var chat = await CreateChatAsync(client, "Cyrillic chat");
            const string fileName = "Отчёт за квартал.pdf";

            var upload = await client.PostAsync($"/api/Message/{chat.Id}/attachments",
                FileForm(fileName, System.Text.Encoding.UTF8.GetBytes("%PDF-1.4"), "application/pdf"));
            var attachment = await upload.Content.ReadFromJsonAsync<MessageAttachmentDto>();

            Assert.Equal(fileName, attachment!.FileName);

            var download = await client.GetAsync($"/api/Message/attachments/{attachment.Id}");
            download.EnsureSuccessStatusCode();

            var disposition = download.Content.Headers.ContentDisposition;
            Assert.Equal(fileName, disposition!.FileNameStar);
        }

        private async Task<int> DirectChatWithAsync(HttpClient client, string partnerName)
        {
            var search = await client.GetFromJsonAsync<List<UserDto>>(
                $"/api/User?searchTerm={partnerName}&pageSize=20");
            var partnerId = search!.Single(u => u.UserName == partnerName).Id;

            var created = await client.PostAsync($"/api/Chat/direct/{partnerId}", null);
            created.EnsureSuccessStatusCode();

            return (await created.Content.ReadFromJsonAsync<ChatDto>())!.Id;
        }

        private static async Task SendAsync(HttpClient client, int chatId, string text)
        {
            var sent = await client.PostAsJsonAsync($"/api/Message/{chatId}/messages",
                new { content = text });
            sent.EnsureSuccessStatusCode();
        }

        private static async Task<int> UserIdAsync(HttpClient client, string userName)
        {
            var search = await client.GetFromJsonAsync<List<UserDto>>(
                $"/api/User?searchTerm={userName}&pageSize=20");
            return search!.Single(u => u.UserName == userName).Id;
        }

        [Fact]
        public async Task TransferOwnership_LetsTheFormerOwnerLeave()
        {
            var ownerName = UniqueName("towna");
            var heirName = UniqueName("townb");
            var owner = await AuthenticatedClientAsync(ownerName);
            var heir = await AuthenticatedClientAsync(heirName);

            var ownerId = await UserIdAsync(owner, ownerName);
            var heirId = await UserIdAsync(owner, heirName);

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

        private static async Task SetWhoCanInviteAsync(HttpClient client, int level)
        {
            var updated = await client.PutAsJsonAsync("/api/User/privacy",
                new { whoCanMessage = 1, whoCanInvite = level });
            updated.EnsureSuccessStatusCode();
        }

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
        public async Task TransferOwnership_ByANonOwner_IsForbidden()
        {
            var ownerName = UniqueName("nowna");
            var memberName = UniqueName("nownb");
            var owner = await AuthenticatedClientAsync(ownerName);
            var member = await AuthenticatedClientAsync(memberName);

            var memberId = await UserIdAsync(owner, memberName);

            var chat = await CreateChatAsync(owner, "Group " + ownerName);
            var added = await owner.PostAsJsonAsync($"/api/Chat/{chat.Id}/users",
                new { userId = memberId });
            added.EnsureSuccessStatusCode();

            var transfer = await member.PostAsync($"/api/Chat/{chat.Id}/users/{memberId}/owner", null);
            Assert.Equal(HttpStatusCode.Forbidden, transfer.StatusCode);
        }

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
