using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Entities.Models;
using Services.DataTransferObjects;

namespace Vesty.Tests
{
    public abstract class ApiTestBase
    {
        protected readonly VestyApiFactory Factory;

        protected ApiTestBase(VestyApiFactory factory)
        {
            Factory = factory;
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
            int whoCanSeeProfile = PrivacyLevel.Everyone)
        {
            var updated = await client.PutAsJsonAsync("/api/User/privacy",
                new { whoCanMessage, whoCanInvite, whoCanSeeProfile });
            updated.EnsureSuccessStatusCode();
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
