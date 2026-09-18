using System.Net;
using System.Net.Http.Json;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class LoginLockoutApiTests : ApiTestBase
    {
        public LoginLockoutApiTests(VestyApiFactory factory) : base(factory) { }

        private async Task<string> RegisteredAsync(string prefix)
        {
            var name = UniqueName(prefix);
            await AuthenticatedClientAsync(name);
            return name;
        }

        private async Task<HttpStatusCode> LoginAsync(string userName, string password)
        {
            var response = await Factory.CreateClient().PostAsJsonAsync("/api/User/login",
                new { userName, password });
            return response.StatusCode;
        }

        private async Task FailAsync(string userName, int times)
        {
            for (var i = 0; i < times; i++)
                Assert.Equal(HttpStatusCode.Unauthorized, await LoginAsync(userName, "Wrong123"));
        }

        [Fact]
        public async Task FourWrongPasswords_StillLetTheOwnerIn()
        {
            var name = await RegisteredAsync("lock4");

            await FailAsync(name, 4);

            Assert.Equal(HttpStatusCode.OK, await LoginAsync(name, "Test123"));
        }

        [Fact]
        public async Task FiveWrongPasswords_LockEvenTheRightOne()
        {
            var name = await RegisteredAsync("lock5");

            await FailAsync(name, 5);

            Assert.Equal(HttpStatusCode.TooManyRequests, await LoginAsync(name, "Test123"));
        }

        [Fact]
        public async Task ASuccessfulLogin_StartsTheCountAfresh()
        {
            var name = await RegisteredAsync("lockr");

            await FailAsync(name, 4);
            Assert.Equal(HttpStatusCode.OK, await LoginAsync(name, "Test123"));
            await FailAsync(name, 4);

            Assert.Equal(HttpStatusCode.OK, await LoginAsync(name, "Test123"));
        }

        [Fact]
        public async Task ALockedAccount_LeavesOthersAlone()
        {
            var locked = await RegisteredAsync("lockx");
            var other = await RegisteredAsync("locky");

            await FailAsync(locked, 5);

            Assert.Equal(HttpStatusCode.OK, await LoginAsync(other, "Test123"));
        }

        [Fact]
        public async Task AnUnknownUser_IsSimplyRejected()
        {
            Assert.Equal(HttpStatusCode.Unauthorized,
                await LoginAsync(UniqueName("ghost"), "Test123"));
        }
    }
}
