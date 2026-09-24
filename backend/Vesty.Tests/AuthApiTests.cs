using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Repository.Interfaces;
using Services.DataTransferObjects;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class AuthApiTests : ApiTestBase
    {
        public AuthApiTests(VestyApiFactory factory) : base(factory) { }

        private async Task<DateTime> SessionDeadlineOfAsync(int userId)
        {
            using var scope = Factory.Services.CreateScope();
            var repository = scope.ServiceProvider.GetRequiredService<IRepositoryManager>();
            var user = await repository.User.GetUserAsync(userId, trackChanges: false);
            return user!.RefreshTokenExpiryTime;
        }

        private async Task<TokenDto> LoginAsync(string userName, bool? rememberMe)
        {
            var client = Factory.CreateClient();
            var login = rememberMe is null
                ? await client.PostAsJsonAsync("/api/User/login", new { userName, password = "Test123" })
                : await client.PostAsJsonAsync("/api/User/login",
                    new { userName, password = "Test123", rememberMe });
            login.EnsureSuccessStatusCode();
            return (await login.Content.ReadFromJsonAsync<TokenDto>())!;
        }

        [Fact]
        public async Task TheAccessToken_LastsAsLongAsConfigured()
        {
            var account = await AccountAsync("short");

            var tokens = await LoginAsync(account.Name, rememberMe: true);

            var expiry = new JwtSecurityTokenHandler().ReadJwtToken(tokens.AccessToken).ValidTo;
            Assert.InRange(expiry, DateTime.UtcNow.AddMinutes(13), DateTime.UtcNow.AddMinutes(17));
        }

        [Fact]
        public async Task ARememberedLogin_KeepsTheSessionForAMonth()
        {
            var account = await AccountAsync("remem");

            await LoginAsync(account.Name, rememberMe: true);

            Assert.InRange(await SessionDeadlineOfAsync(account.Id),
                DateTime.UtcNow.AddDays(30).AddMinutes(-5), DateTime.UtcNow.AddDays(30).AddMinutes(5));
        }

        [Fact]
        public async Task APlainLogin_KeepsTheSessionForADay()
        {
            var account = await AccountAsync("forget");

            await LoginAsync(account.Name, rememberMe: false);

            Assert.InRange(await SessionDeadlineOfAsync(account.Id),
                DateTime.UtcNow.AddHours(23), DateTime.UtcNow.AddHours(25));
        }

        [Fact]
        public async Task ALoginThatSaysNothing_IsNotRemembered()
        {
            var account = await AccountAsync("silent");

            await LoginAsync(account.Name, rememberMe: null);

            Assert.InRange(await SessionDeadlineOfAsync(account.Id),
                DateTime.UtcNow.AddHours(23), DateTime.UtcNow.AddHours(25));
        }

        [Fact]
        public async Task Refreshing_DoesNotPushTheDeadlineFurther()
        {
            var account = await AccountAsync("refr");
            var tokens = await LoginAsync(account.Name, rememberMe: true);
            var deadline = await SessionDeadlineOfAsync(account.Id);

            var refreshed = await Factory.CreateClient().PostAsJsonAsync("/api/User/refresh", tokens);
            refreshed.EnsureSuccessStatusCode();

            Assert.Equal(deadline, await SessionDeadlineOfAsync(account.Id));
        }

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

        [Fact]
        public async Task RegisteringManyAtOnce_CreatesNobody()
        {
            var client = Factory.CreateClient();
            var userName = UniqueName("bulk");

            var bulk = await client.PostAsJsonAsync("/api/User/register/collection",
                new[] { new { userName, password = "Test123" } });
            var login = await client.PostAsJsonAsync("/api/User/login",
                new { userName, password = "Test123" });

            Assert.Equal(HttpStatusCode.NotFound, bulk.StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
        }
    }
}
