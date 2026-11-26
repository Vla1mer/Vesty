using System.Collections.Concurrent;
using System.Net.Http.Json;
using Microsoft.AspNetCore.SignalR.Client;
using Services.DataTransferObjects;
using Vesty.Hubs;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class ReconnectRecoveryApiTests : ApiTestBase
    {
        public ReconnectRecoveryApiTests(VestyApiFactory factory) : base(factory) { }

        private async Task<HubConnection> ListenAsync(Account account, ConcurrentQueue<string> heard)
        {
            var hub = HubFor(account.Client);
            hub.On<MessageDto>(ChatNotifier.MessageReceived, message => heard.Enqueue(message.Content ?? string.Empty));
            await hub.StartAsync();
            return hub;
        }

        [Fact]
        public async Task MessagesSentWhileDisconnected_AreRecoveredAfterReconnect()
        {
            var sender = await AccountAsync("recs");
            var receiver = await AccountAsync("recr");
            var chat = await CreateChatAsync(sender.Client, "Reconnect chat");
            await AddAsync(sender, chat.Id, receiver);

            var heard = new ConcurrentQueue<string>();
            var hub = await ListenAsync(receiver, heard);
            await SendAsync(sender.Client, chat.Id, "before");
            await WaitUntil(() => heard.Contains("before"), "the live message arrives");

            await hub.StopAsync();
            await hub.DisposeAsync();
            await SendAsync(sender.Client, chat.Id, "offline 1");
            await SendAsync(sender.Client, chat.Id, "offline 2");

            await using var reconnected = await ListenAsync(receiver, heard);
            var history = await receiver.Client.GetFromJsonAsync<List<MessageDto>>(
                $"/api/Chat/{chat.Id}/messages");

            var stored = history!.Select(m => m.Content).ToList();
            Assert.DoesNotContain("offline 1", heard);
            Assert.DoesNotContain("offline 2", heard);
            Assert.Contains("before", stored);
            Assert.Contains("offline 1", stored);
            Assert.Contains("offline 2", stored);

            await SendAsync(sender.Client, chat.Id, "after");
            await WaitUntil(() => heard.Contains("after"), "live delivery resumes after reconnecting");
        }
    }
}
