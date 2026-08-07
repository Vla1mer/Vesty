using System.Net.Http.Json;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Services.DataTransferObjects;
using Services.Interfaces;
using Vesty.Constants;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class PresenceApiTests : ApiTestBase
    {
        public PresenceApiTests(VestyApiFactory factory) : base(factory)
        {
        }

        private IPresenceTracker Presence =>
            Factory.Services.GetRequiredService<IPresenceTracker>();

        private async Task<string> TokenAsync(string userName)
        {
            var client = Factory.CreateClient();
            (await client.PostAsJsonAsync("/api/User/register",
                new { userName, password = "Test123" })).EnsureSuccessStatusCode();

            var login = await client.PostAsJsonAsync("/api/User/login",
                new { userName, password = "Test123" });
            login.EnsureSuccessStatusCode();

            return (await login.Content.ReadFromJsonAsync<TokenDto>())!.AccessToken;
        }

        private HubConnection Hub(string token) =>
            new HubConnectionBuilder()
                .WithUrl(new Uri(Factory.Server.BaseAddress, HubRoutes.ChatHub), options =>
                {
                    options.HttpMessageHandlerFactory = _ => Factory.Server.CreateHandler();
                    options.AccessTokenProvider = () => Task.FromResult<string?>(token);
                })
                .Build();

        private DateTime? LastSeenOf(int userId)
        {
            using var scope = Factory.Services
                .GetRequiredService<IServiceScopeFactory>().CreateScope();
            var repository = scope.ServiceProvider
                .GetRequiredService<Repository.Interfaces.IRepositoryManager>();
            return repository.User.GetUserAsync(userId, trackChanges: false)
                .GetAwaiter().GetResult()?.LastSeenAt;
        }

        [Fact]
        public async Task ConnectingToTheHub_BringsTheUserOnline()
        {
            var name = UniqueName("pres1");
            var token = await TokenAsync(name);
            var userId = await UserIdAsync(await AuthenticatedClientAsync(UniqueName("pres1x")), name);

            Assert.False(Presence.IsOnline(userId));

            await using var connection = Hub(token);
            await connection.StartAsync();

            await WaitUntil(() => Presence.IsOnline(userId), "the user shows as online");
        }

        [Fact]
        public async Task ClosingTheOnlyConnection_TakesTheUserOffline()
        {
            var name = UniqueName("pres2");
            var token = await TokenAsync(name);
            var watcher = await AuthenticatedClientAsync(UniqueName("pres2x"));
            var userId = await UserIdAsync(watcher, name);

            var connection = Hub(token);
            await connection.StartAsync();
            await connection.StopAsync();
            await connection.DisposeAsync();

            await WaitUntil(() => !Presence.IsOnline(userId), "the user shows as offline");
        }

        [Fact]
        public async Task ClosingOneOfTwoConnections_LeavesTheUserOnline()
        {
            var name = UniqueName("pres3");
            var token = await TokenAsync(name);
            var watcher = await AuthenticatedClientAsync(UniqueName("pres3x"));
            var userId = await UserIdAsync(watcher, name);

            await using var kept = Hub(token);
            var closed = Hub(token);
            await kept.StartAsync();
            await closed.StartAsync();

            await closed.StopAsync();
            await closed.DisposeAsync();

            await Task.Delay(300);
            Assert.True(Presence.IsOnline(userId));

            await kept.StopAsync();
            await WaitUntil(() => !Presence.IsOnline(userId),
                "closing the kept connection finally takes the user offline");
        }

        [Fact]
        public async Task LeavingForGood_StampsTheLastSeenTime()
        {
            var name = UniqueName("pres4");
            var token = await TokenAsync(name);
            var watcher = await AuthenticatedClientAsync(UniqueName("pres4x"));
            var userId = await UserIdAsync(watcher, name);
            var before = DateTime.UtcNow;

            var connection = Hub(token);
            await connection.StartAsync();
            await connection.StopAsync();
            await connection.DisposeAsync();

            await WaitUntil(() => LastSeenOf(userId) is not null, "the last seen time is stored");

            var stamped = LastSeenOf(userId)!.Value;
            Assert.InRange(stamped, before, DateTime.UtcNow.AddSeconds(5));
        }
    }
}
