using System.Net;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class ChatFilesApiTests : ApiTestBase
    {
        public ChatFilesApiTests(VestyApiFactory factory) : base(factory) { }

        private static async Task DeleteChatAsync(Account account, int chatId)
        {
            var deleted = await account.Client.DeleteAsync($"/api/Chat/{chatId}");
            Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        }

        [Fact]
        public async Task DeletingAGroup_RemovesTheFilesOfEveryMember()
        {
            var owner = await AccountAsync("cfown");
            var member = await AccountAsync("cfmem");
            var chat = await CreateChatAsync(owner.Client, "Files");
            await AddAsync(owner, chat.Id, member);
            var ownersFile = await StorageKeyOfAsync(await SendFileAsync(owner, chat.Id));
            var membersFile = await StorageKeyOfAsync(await SendFileAsync(member, chat.Id));

            await DeleteChatAsync(owner, chat.Id);

            Assert.False(await IsStoredAsync(ownersFile));
            Assert.False(await IsStoredAsync(membersFile));
        }

        [Fact]
        public async Task DeletingADirectChat_RemovesItsFiles()
        {
            var first = await AccountAsync("cfdra");
            var second = await AccountAsync("cfdrb");
            var chatId = await DirectChatWithAsync(first.Client, second.Name);
            var file = await StorageKeyOfAsync(await SendFileAsync(second, chatId));

            await DeleteChatAsync(first, chatId);

            Assert.False(await IsStoredAsync(file));
        }

        [Fact]
        public async Task DeletingAChat_LeavesTheFilesOfOtherChats()
        {
            var owner = await AccountAsync("cfkep");
            var doomed = await CreateChatAsync(owner.Client, "Doomed");
            var kept = await CreateChatAsync(owner.Client, "Kept");
            await SendFileAsync(owner, doomed.Id);
            var keptFile = await StorageKeyOfAsync(await SendFileAsync(owner, kept.Id));

            await DeleteChatAsync(owner, doomed.Id);

            Assert.True(await IsStoredAsync(keptFile));
        }
    }
}
