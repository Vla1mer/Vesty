using System.Net.Http.Json;
using Services.DataTransferObjects;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class MessageSearchApiTests : ApiTestBase
    {
        public MessageSearchApiTests(VestyApiFactory factory) : base(factory) { }

        private static async Task<List<string>> SearchAsync(HttpClient client, int chatId, string term)
        {
            var found = await client.GetFromJsonAsync<List<MessageDto>>(
                $"/api/Message?chatId={chatId}&searchTerm={Uri.EscapeDataString(term)}");
            return found!.Select(m => m.Content ?? string.Empty).ToList();
        }

        [Fact]
        public async Task Search_FindsTextThatIsStoredEncrypted()
        {
            var owner = await AccountAsync("srch1");
            var chat = await CreateChatAsync(owner.Client, "Search chat");
            await SendAsync(owner.Client, chat.Id, "Meet at the Library at five");
            await SendAsync(owner.Client, chat.Id, "Bring the notes");

            var found = await SearchAsync(owner.Client, chat.Id, "library");

            Assert.Equal(["Meet at the Library at five"], found);
        }

        [Fact]
        public async Task Search_DoesNotReachChatsTheUserIsNotIn()
        {
            var owner = await AccountAsync("srch2a");
            var outsider = await AccountAsync("srch2b");
            var chat = await CreateChatAsync(owner.Client, "Private search chat");
            await SendAsync(owner.Client, chat.Id, "secret plan");

            var found = await SearchAsync(outsider.Client, chat.Id, "secret");

            Assert.Empty(found);
        }
    }
}
