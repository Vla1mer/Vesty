using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using Entities.Models;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Repository.Interfaces;
using Services.DataTransferObjects;
using Services.Storage;
using Vesty.Hubs;

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

        private static async Task<int> UploadAsync(Account account, int chatId)
        {
            var upload = await account.Client.PostAsync($"/api/Message/{chatId}/attachments",
                FileForm("note.txt", new byte[] { 1, 2, 3 }, "text/plain"));
            upload.EnsureSuccessStatusCode();
            return (await upload.Content.ReadFromJsonAsync<MessageAttachmentDto>())!.Id;
        }

        private static async Task<int> SendFileAsync(Account account, int chatId)
        {
            var attachmentId = await UploadAsync(account, chatId);
            var sent = await account.Client.PostAsJsonAsync($"/api/Message/{chatId}/messages",
                new { content = "file", attachmentIds = new[] { attachmentId } });
            sent.EnsureSuccessStatusCode();
            return attachmentId;
        }

        private async Task<string> StorageKeyOfAsync(int attachmentId)
        {
            using var scope = Factory.Services.CreateScope();
            var repository = scope.ServiceProvider.GetRequiredService<IRepositoryManager>();
            return (await repository.Attachment.GetAttachmentAsync(attachmentId, trackChanges: false))!.StorageKey;
        }

        private async Task<bool> IsStoredAsync(string storageKey)
        {
            using var scope = Factory.Services.CreateScope();
            var storage = scope.ServiceProvider.GetRequiredService<IFileStorage>();
            try
            {
                await storage.GetAsync(storageKey);
                return true;
            }
            catch (Exception)
            {
                return false;
            }
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
        public async Task DeletingAnAccount_TellsTheRemainingMembers()
        {
            var owner = await AccountAsync("dnown");
            var heir = await AccountAsync("dnher");
            var host = await AccountAsync("dnhst");
            var owned = await CreateChatAsync(owner.Client, "Owned");
            var joined = await CreateChatAsync(host.Client, "Joined");
            await AddAsync(owner, owned.Id, heir);
            await AddAsync(host, joined.Id, owner);

            var heirHears = new ConcurrentBag<int>();
            var hostHears = new ConcurrentBag<int>();
            await using var heirHub = HubFor(heir.Client);
            await using var hostHub = HubFor(host.Client);
            heirHub.On<ChatUpdatedSignalrDto>(ChatNotifier.ChatUpdated, updated => heirHears.Add(updated.ChatId));
            hostHub.On<ChatUpdatedSignalrDto>(ChatNotifier.ChatUpdated, updated => hostHears.Add(updated.ChatId));
            await heirHub.StartAsync();
            await hostHub.StartAsync();

            await DeleteAccountAsync(owner);

            await WaitUntil(() => heirHears.Contains(owned.Id), "the heir hears about the group they inherited");
            await WaitUntil(() => hostHears.Contains(joined.Id), "the host hears that a member is gone");
        }

        [Fact]
        public async Task DeletingAnAccount_RemovesItsFilesFromTheStorage()
        {
            var owner = await AccountAsync("dsown");
            var leaving = await AccountAsync("dslea");
            var chat = await CreateChatAsync(owner.Client, "Files");
            await AddAsync(owner, chat.Id, leaving);
            var sent = await StorageKeyOfAsync(await SendFileAsync(leaving, chat.Id));
            var unsent = await StorageKeyOfAsync(await UploadAsync(leaving, chat.Id));
            Assert.True(await IsStoredAsync(sent));

            await DeleteAccountAsync(leaving);

            Assert.False(await IsStoredAsync(sent));
            Assert.False(await IsStoredAsync(unsent));
        }

        [Fact]
        public async Task DeletingAnAccount_KeepsTheFilesOfOthers()
        {
            var owner = await AccountAsync("dkown");
            var leaving = await AccountAsync("dklea");
            var chat = await CreateChatAsync(owner.Client, "Kept files");
            await AddAsync(owner, chat.Id, leaving);
            await SendFileAsync(leaving, chat.Id);
            var kept = await StorageKeyOfAsync(await SendFileAsync(owner, chat.Id));

            await DeleteAccountAsync(leaving);

            Assert.True(await IsStoredAsync(kept));
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
