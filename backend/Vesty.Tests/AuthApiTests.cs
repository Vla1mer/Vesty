using System.Net;
using System.Net.Http.Json;
using Services.DataTransferObjects;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class AuthApiTests : ApiTestBase
    {
        public AuthApiTests(VestyApiFactory factory) : base(factory) { }

        [Fact]
        public async Task Register_ThenLogin_ReturnsTokens()
        {
            var client = Factory.CreateClient();
            var userName = UniqueName("flow");

            var register = await client.PostAsJsonAsync("/api/User/register",
                new { userName, password = "Test123" });
            var login = await client.PostAsJsonAsync("/api/User/login",
                new { userName, password = "Test123" });

            Assert.Equal(HttpStatusCode.Created, register.StatusCode);
            Assert.Equal(HttpStatusCode.OK, login.StatusCode);

            var tokens = await login.Content.ReadFromJsonAsync<TokenDto>();
            Assert.False(string.IsNullOrWhiteSpace(tokens!.AccessToken));
        }

        [Fact]
        public async Task Login_WithWrongPassword_IsUnauthorized()
        {
            var client = Factory.CreateClient();
            var userName = UniqueName("wrongpw");
            await client.PostAsJsonAsync("/api/User/register", new { userName, password = "Test123" });

            var login = await client.PostAsJsonAsync("/api/User/login",
                new { userName, password = "WrongPassword1" });

            Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
        }

        [Fact]
        public async Task Chat_WithoutToken_IsUnauthorized()
        {
            var client = Factory.CreateClient();

            var response = await client.GetAsync("/api/Chat");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
}
