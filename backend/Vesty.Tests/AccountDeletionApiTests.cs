using System.Net;
using System.Net.Http.Json;
using Entities.Models;
using Microsoft.Extensions.DependencyInjection;
using Repository.Interfaces;
using Services.DataTransferObjects;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class AccountDeletionApiTests : ApiTestBase
    {
        public AccountDeletionApiTests(VestyApiFactory factory) : base(factory) { }

        private record Account(HttpClient Client, int Id, string Name);

        private async Task<Account> AccountAsync(string prefix)
        {
            var name = UniqueName(prefix);
            var client = await AuthenticatedClientAsync(name);
            await SetPrivacyAsync(client, whoCanInvite: PrivacyLevel.Everyone);
            return new Account(client, await UserIdAsync(client, name), name);
        }

        private static async Task AddAsync(Account owner, int chatId, Account member)
        {
            var added = await owner.Client.PostAsJsonAsync($"/api/Chat/{chatId}/users",
                new { userId = member.Id });
            added.EnsureSuccessStatusCode();
        }

        private static async Task PromoteAsync(Account owner, int chatId, Account member)
        {
            var promoted = await owner.Client.PatchAsJsonAsync(
                $"/api/Chat/{chatId}/users/{member.Id}/role", new { roleId = UserRole.Admin });
            promoted.EnsureSuccessStatusCode();
        }

        private static async Task DeleteAccountAsync(Account account)
        {
            var deleted = await account.Client.DeleteAsync($"/api/User/{account.Id}");
            Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        }

        private static async Task<Dictionary<int, int>> RolesAsync(Account viewer, int chatId)
        {
            var members = await viewer.Client.GetFromJsonAsync<List<ChatMemberWithRoleDto>>(
                $"/api/Chat/{chatId}/users");
            return members!.ToDictionary(m => m.UserId, m => m.RoleId);
        }

        private async Task<bool> ChatExistsAsync(int chatId)
        {
            using var scope = Factory.Services.CreateScope();
            var repository = scope.ServiceProvider.GetRequiredService<IRepositoryManager>();
            return await repository.Chat.GetChatAsync(chatId, trackChanges: false) is not null;
        }

        [Fact]
        public async Task DeletingTheOwner_PassesTheGroupToAnAdmin()
        {
            var owner = await AccountAsync("dlown");
            var older = await AccountAsync("dlold");
            var admin = await AccountAsync("dladm");
            var chat = await CreateChatAsync(owner.Client, "Heirs");
            await AddAsync(owner, chat.Id, older);
            await AddAsync(owner, chat.Id, admin);
            await PromoteAsync(owner, chat.Id, admin);

            await DeleteAccountAsync(owner);

            var roles = await RolesAsync(admin, chat.Id);
            Assert.Equal(UserRole.Owner, roles[admin.Id]);
            Assert.Equal(UserRole.User, roles[older.Id]);
            Assert.False(roles.ContainsKey(owner.Id));
        }

        [Fact]
        public async Task DeletingTheOwner_WithoutAdmins_PassesTheGroupToTheOldestMember()
        {
            var owner = await AccountAsync("dnown");
            var first = await AccountAsync("dnfst");
            var second = await AccountAsync("dnsnd");
            var chat = await CreateChatAsync(owner.Client, "No admins");
            await AddAsync(owner, chat.Id, first);
            await AddAsync(owner, chat.Id, second);

            await DeleteAccountAsync(owner);

            var roles = await RolesAsync(first, chat.Id);
            Assert.Equal(UserRole.Owner, roles[first.Id]);
            Assert.Equal(UserRole.User, roles[second.Id]);
        }

        [Fact]
        public async Task DeletingTheOnlyMember_RemovesTheGroup()
        {
            var owner = await AccountAsync("dlone");
            var chat = await CreateChatAsync(owner.Client, "Alone");

            await DeleteAccountAsync(owner);

            Assert.False(await ChatExistsAsync(chat.Id));
        }

        [Fact]
        public async Task DeletingAMember_LeavesTheOwnerInCharge()
        {
            var owner = await AccountAsync("dmown");
            var member = await AccountAsync("dmmem");
            var chat = await CreateChatAsync(owner.Client, "Stays");
            await AddAsync(owner, chat.Id, member);

            await DeleteAccountAsync(member);

            var roles = await RolesAsync(owner, chat.Id);
            Assert.Equal(UserRole.Owner, Assert.Single(roles).Value);
            Assert.Equal(owner.Id, roles.Keys.Single());
        }

        [Fact]
        public async Task DeletingAnAccount_HandsNoDirectChatToThePartner()
        {
            var leaving = await AccountAsync("ddlea");
            var partner = await AccountAsync("ddprt");
            var chatId = await DirectChatWithAsync(partner.Client, leaving.Name);

            await DeleteAccountAsync(leaving);

            Assert.True(await ChatExistsAsync(chatId));
            Assert.Equal(UserRole.User, Assert.Single(await RolesAsync(partner, chatId)).Value);
        }

        [Fact]
        public async Task DeletingSomebodyElse_IsForbidden()
        {
            var owner = await AccountAsync("dfown");
            var other = await AccountAsync("dfoth");

            var deleted = await other.Client.DeleteAsync($"/api/User/{owner.Id}");

            Assert.Equal(HttpStatusCode.Forbidden, deleted.StatusCode);
        }
    }
}
