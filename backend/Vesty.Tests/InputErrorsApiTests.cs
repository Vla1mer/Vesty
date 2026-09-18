using System.Net;
using System.Net.Http.Json;
using System.Text;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class InputErrorsApiTests : ApiTestBase
    {
        public InputErrorsApiTests(VestyApiFactory factory) : base(factory) { }

        private record Account(HttpClient Client, int Id, string Name);

        private async Task<Account> AccountAsync(string prefix)
        {
            var name = UniqueName(prefix);
            var client = await AuthenticatedClientAsync(name);
            return new Account(client, await UserIdAsync(client, name), name);
        }

        private static Task<HttpResponseMessage> RenameAsync(Account account, string userName) =>
            account.Client.PutAsJsonAsync($"/api/User/{account.Id}", new { userName });

        private async Task<HttpStatusCode> LoginAsync(string userName) =>
            (await Factory.CreateClient().PostAsJsonAsync("/api/User/login",
                new { userName, password = "Test123" })).StatusCode;

        private static async Task<string> MessageOf(HttpResponseMessage response) =>
            (await response.Content.ReadFromJsonAsync<Dictionary<string, object>>())!["Message"].ToString()!;

        [Theory]
        [InlineData("/api/User/presence/(a,b)")]
        [InlineData("/api/User/collection/(a,b)")]
        [InlineData("/api/User/presence/(99999999999)")]
        public async Task IdsThatAreNotNumbers_AreABadRequest(string url)
        {
            var account = await AccountAsync("ids");

            var response = await account.Client.GetAsync(url);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Register_WithATooLongUserName_IsRejected()
        {
            var userName = new string('q', 51);

            var register = await Factory.CreateClient().PostAsJsonAsync("/api/User/register",
                new { userName, password = "Test123" });

            Assert.Equal(HttpStatusCode.UnprocessableEntity, register.StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, await LoginAsync(userName));
        }

        [Fact]
        public async Task Register_WithATooLongName_IsRejected()
        {
            var register = await Factory.CreateClient().PostAsJsonAsync("/api/User/register",
                new { userName = UniqueName("longn"), password = "Test123", name = new string('n', 101) });

            Assert.Equal(HttpStatusCode.UnprocessableEntity, register.StatusCode);
        }

        [Fact]
        public async Task Rename_ToATakenName_SaysItIsTaken()
        {
            var account = await AccountAsync("rnme");
            var other = await AccountAsync("rnoth");

            var renamed = await RenameAsync(account, other.Name);

            Assert.Equal(HttpStatusCode.BadRequest, renamed.StatusCode);
            Assert.Contains("already taken", await MessageOf(renamed));
        }

        [Fact]
        public async Task Rename_ToANameWithSpaces_IsRejected()
        {
            var account = await AccountAsync("rnsp");

            var renamed = await RenameAsync(account, "with spaces");

            Assert.Equal(HttpStatusCode.BadRequest, renamed.StatusCode);
            Assert.Equal(HttpStatusCode.OK, await LoginAsync(account.Name));
        }

        [Fact]
        public async Task Rename_ToTheSameName_IsFine()
        {
            var account = await AccountAsync("rnsame");

            var renamed = await RenameAsync(account, account.Name);

            Assert.Equal(HttpStatusCode.NoContent, renamed.StatusCode);
        }

        [Fact]
        public async Task Rename_ToAFreeName_LetsTheUserSignInWithIt()
        {
            var account = await AccountAsync("rnold");
            var fresh = UniqueName("rnnew");

            var renamed = await RenameAsync(account, fresh);

            Assert.Equal(HttpStatusCode.NoContent, renamed.StatusCode);
            Assert.Equal(HttpStatusCode.OK, await LoginAsync(fresh));
            Assert.Equal(HttpStatusCode.Unauthorized, await LoginAsync(account.Name));
        }

        [Fact]
        public async Task PatchingTheUserName_FollowsTheSameRules()
        {
            var account = await AccountAsync("rnpatch");
            var patch = new StringContent(
                "[{\"op\":\"replace\",\"path\":\"/userName\",\"value\":\"with spaces\"}]",
                Encoding.UTF8, "application/json-patch+json");

            var patched = await account.Client.PatchAsync($"/api/User/{account.Id}", patch);

            Assert.Equal(HttpStatusCode.BadRequest, patched.StatusCode);
            Assert.Equal(HttpStatusCode.OK, await LoginAsync(account.Name));
        }

        [Fact]
        public async Task AnUnexpectedFailure_KeepsItsDetailsToItself()
        {
            var account = await AccountAsync("oops");
            (await account.Client.DeleteAsync($"/api/User/{account.Id}")).EnsureSuccessStatusCode();

            var created = await account.Client.PostAsJsonAsync("/api/Chat", new { name = "Ghost" });

            Assert.Equal(HttpStatusCode.InternalServerError, created.StatusCode);
            Assert.Equal("Something went wrong. Please try again later.", await MessageOf(created));
        }
    }
}
