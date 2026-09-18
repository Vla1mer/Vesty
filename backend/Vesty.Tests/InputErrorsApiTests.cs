using System.Net;
using System.Net.Http.Json;
using System.Text;
using Services.DataTransferObjects;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class InputErrorsApiTests : ApiTestBase
    {
        public InputErrorsApiTests(VestyApiFactory factory) : base(factory) { }

        private static Task<HttpResponseMessage> RenameAsync(Account account, string userName) =>
            account.Client.PutAsJsonAsync($"/api/User/{account.Id}", new { userName });

        private async Task<HttpStatusCode> LoginAsync(string userName) =>
            (await Factory.CreateClient().PostAsJsonAsync("/api/User/login",
                new { userName, password = "Test123" })).StatusCode;

        private static async Task<string> MessageOf(HttpResponseMessage response) =>
            (await response.Content.ReadFromJsonAsync<Dictionary<string, object>>())!["Message"].ToString()!;

        private async Task<(Account account, int messageId)> MessageToReactToAsync()
        {
            var account = await AccountAsync("react");
            var chat = await CreateChatAsync(account.Client, "Reactions");
            var sent = await account.Client.PostAsJsonAsync($"/api/Message/{chat.Id}/messages",
                new { content = "react to me" });
            return (account, (await sent.Content.ReadFromJsonAsync<MessageDto>())!.Id);
        }

        private static StringContent Patch(string path, string value) =>
            new($"[{{\"op\":\"replace\",\"path\":\"{path}\",\"value\":\"{value}\"}}]",
                Encoding.UTF8, "application/json-patch+json");

        private static string InAFewDays() =>
            DateTime.UtcNow.AddDays(3).ToString("yyyy-MM-dd");

        [Theory]
        [InlineData("🔥")]
        [InlineData("❤️")]
        [InlineData("👍🏽")]
        [InlineData("👨‍👩‍👧")]
        public async Task AnEmoji_IsAcceptedAsAReaction(string emoji)
        {
            var (account, messageId) = await MessageToReactToAsync();

            var reacted = await account.Client.PostAsJsonAsync(
                $"/api/Message/{messageId}/reactions", new { emoji });

            Assert.Equal(HttpStatusCode.NoContent, reacted.StatusCode);
        }

        [Theory]
        [InlineData("hello")]
        [InlineData("a🔥")]
        [InlineData("🔥 🔥")]
        [InlineData("!!")]
        [InlineData("12")]
        public async Task Text_IsNotAReaction(string emoji)
        {
            var (account, messageId) = await MessageToReactToAsync();

            var reacted = await account.Client.PostAsJsonAsync(
                $"/api/Message/{messageId}/reactions", new { emoji });

            Assert.Equal(HttpStatusCode.BadRequest, reacted.StatusCode);
        }

        [Fact]
        public async Task Register_WithABirthdayInTheFuture_IsRejected()
        {
            var register = await Factory.CreateClient().PostAsJsonAsync("/api/User/register",
                new { userName = UniqueName("bday"), password = "Test123", birthday = InAFewDays() });

            Assert.Equal(HttpStatusCode.UnprocessableEntity, register.StatusCode);
        }

        [Fact]
        public async Task Update_WithABirthdayInTheFuture_IsRejected()
        {
            var account = await AccountAsync("bdput");

            var updated = await account.Client.PutAsJsonAsync($"/api/User/{account.Id}",
                new { userName = account.Name, birthday = InAFewDays() });

            Assert.Equal(HttpStatusCode.UnprocessableEntity, updated.StatusCode);
        }

        [Fact]
        public async Task Update_WithABirthdayToday_IsFine()
        {
            var account = await AccountAsync("bdnow");

            var updated = await account.Client.PutAsJsonAsync($"/api/User/{account.Id}",
                new { userName = account.Name, birthday = DateTime.UtcNow.ToString("yyyy-MM-dd") });

            Assert.Equal(HttpStatusCode.NoContent, updated.StatusCode);
        }

        [Theory]
        [InlineData("/birthday", "2999-01-01")]
        [InlineData("/name", "nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn")]
        public async Task Patching_FollowsTheRulesOfTheForm(string path, string value)
        {
            var account = await AccountAsync("bdpat");

            var patched = await account.Client.PatchAsync($"/api/User/{account.Id}", Patch(path, value));

            Assert.Equal(HttpStatusCode.UnprocessableEntity, patched.StatusCode);
        }

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

            var patched = await account.Client.PatchAsync($"/api/User/{account.Id}",
                Patch("/userName", "with spaces"));

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
