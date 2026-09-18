using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Repository.Interfaces;
using Vesty.Constants;
using Entities.Models;
using Services.DataTransferObjects;
using Services.Storage;

namespace Vesty.Tests
{
    public abstract class ApiTestBase
    {
        protected readonly VestyApiFactory Factory;

        protected ApiTestBase(VestyApiFactory factory)
        {
            Factory = factory;
        }

        protected record Account(HttpClient Client, int Id, string Name);

        protected async Task<Account> AccountAsync(string prefix)
        {
            var name = UniqueName(prefix);
            var client = await AuthenticatedClientAsync(name);
            await SetPrivacyAsync(client, whoCanInvite: PrivacyLevel.Everyone);
            return new Account(client, await UserIdAsync(client, name), name);
        }

        protected static async Task AddAsync(Account owner, int chatId, Account member)
        {
            var added = await owner.Client.PostAsJsonAsync($"/api/Chat/{chatId}/users",
                new { userId = member.Id });
            added.EnsureSuccessStatusCode();
        }

        protected static async Task<int> UploadAsync(Account account, int chatId)
        {
            var upload = await account.Client.PostAsync($"/api/Message/{chatId}/attachments",
                FileForm("note.txt", new byte[] { 1, 2, 3 }, "text/plain"));
            upload.EnsureSuccessStatusCode();
            return (await upload.Content.ReadFromJsonAsync<MessageAttachmentDto>())!.Id;
        }

        protected static async Task<int> SendFileAsync(Account account, int chatId)
        {
            var attachmentId = await UploadAsync(account, chatId);
            var sent = await account.Client.PostAsJsonAsync($"/api/Message/{chatId}/messages",
                new { content = "file", attachmentIds = new[] { attachmentId } });
            sent.EnsureSuccessStatusCode();
            return attachmentId;
        }

        protected async Task<string> StorageKeyOfAsync(int attachmentId)
        {
            using var scope = Factory.Services.CreateScope();
            var repository = scope.ServiceProvider.GetRequiredService<IRepositoryManager>();
            return (await repository.Attachment.GetAttachmentAsync(attachmentId, trackChanges: false))!.StorageKey;
        }

        protected async Task<bool> IsStoredAsync(string storageKey)
        {
            using var scope = Factory.Services.CreateScope();
            var storage = scope.ServiceProvider.GetRequiredService<IFileStorage>();
            try
            {
                await storage.GetAsync(storageKey);
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        protected static string UniqueName(string prefix) =>
            $"{prefix}{Guid.NewGuid():N}"[..20];

        protected async Task<HttpClient> AuthenticatedClientAsync(string userName)
        {
            var client = Factory.CreateClient();

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

        protected static async Task<ChatDto> CreateChatAsync(HttpClient client, string name)
        {
            var response = await client.PostAsJsonAsync("/api/Chat", new { name });
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            return (await response.Content.ReadFromJsonAsync<ChatDto>())!;
        }

        protected static async Task<int> UserIdAsync(HttpClient client, string userName)
        {
            var search = await client.GetFromJsonAsync<List<UserDto>>(
                $"/api/User?searchTerm={userName}&pageSize=20");
            return search!.Single(u => u.UserName == userName).Id;
        }

        protected static async Task<int> DirectChatWithAsync(HttpClient client, string partnerName)
        {
            var partnerId = await UserIdAsync(client, partnerName);

            var created = await client.PostAsync($"/api/Chat/direct/{partnerId}", null);
            created.EnsureSuccessStatusCode();

            return (await created.Content.ReadFromJsonAsync<ChatDto>())!.Id;
        }

        protected static async Task SendAsync(HttpClient client, int chatId, string text)
        {
            var sent = await client.PostAsJsonAsync($"/api/Message/{chatId}/messages",
                new { content = text });
            sent.EnsureSuccessStatusCode();
        }

        protected static async Task SetPrivacyAsync(
            HttpClient client, int whoCanInvite, int whoCanMessage = PrivacyLevel.Everyone,
            int whoCanSeeProfile = PrivacyLevel.Everyone,
            int whoCanSeeOnline = PrivacyLevel.Everyone)
        {
            var updated = await client.PutAsJsonAsync("/api/User/privacy",
                new { whoCanMessage, whoCanInvite, whoCanSeeProfile, whoCanSeeOnline });
            updated.EnsureSuccessStatusCode();
        }

        protected static string TokenOf(HttpClient client) =>
            client.DefaultRequestHeaders.Authorization!.Parameter!;

        protected HubConnection HubFor(HttpClient client)
        {
            var token = TokenOf(client);
            return new HubConnectionBuilder()
                .WithUrl(new Uri(Factory.Server.BaseAddress, HubRoutes.ChatHub), options =>
                {
                    options.HttpMessageHandlerFactory = _ => Factory.Server.CreateHandler();
                    options.AccessTokenProvider = () => Task.FromResult<string?>(token);
                })
                .Build();
        }

        protected static async Task WaitUntil(Func<bool> ready, string what)
        {
            for (var attempt = 0; attempt < 60; attempt++)
            {
                if (ready()) return;
                await Task.Delay(100);
            }

            Assert.Fail($"Timed out waiting until {what}");
        }

        protected static MultipartFormDataContent FileForm(
            string name, byte[] bytes, string contentType)
        {
            var content = new ByteArrayContent(bytes);
            content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
            return new MultipartFormDataContent { { content, "file", name } };
        }
    }
}
