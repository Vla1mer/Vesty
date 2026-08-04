using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Services.DataTransferObjects;

namespace Vesty.Tests
{
    [Collection(ApiCollection.Name)]
    public class AttachmentApiTests : ApiTestBase
    {
        public AttachmentApiTests(VestyApiFactory factory) : base(factory) { }

        [Fact]
        public async Task Attachment_UploadSendDownload_RoundTrips()
        {
            var client = await AuthenticatedClientAsync(UniqueName("att"));
            var chat = await CreateChatAsync(client, "Attachment chat");
            var payload = System.Text.Encoding.UTF8.GetBytes("Содержимое вложения");

            var upload = await client.PostAsync($"/api/Message/{chat.Id}/attachments",
                FileForm("notes.txt", payload, "text/plain"));
            Assert.Equal(HttpStatusCode.Created, upload.StatusCode);
            var attachment = await upload.Content.ReadFromJsonAsync<MessageAttachmentDto>();

            var sent = await client.PostAsJsonAsync($"/api/Message/{chat.Id}/messages",
                new { content = "Файл внутри", attachmentIds = new[] { attachment!.Id } });
            Assert.Equal(HttpStatusCode.Created, sent.StatusCode);

            var messages = await client.GetFromJsonAsync<List<MessageDto>>($"/api/Chat/{chat.Id}/messages");
            var stored = Assert.Single(messages!).Attachments;
            Assert.Equal("notes.txt", Assert.Single(stored).FileName);

            var download = await client.GetAsync($"/api/Message/attachments/{attachment.Id}");
            download.EnsureSuccessStatusCode();
            Assert.Equal(payload, await download.Content.ReadAsByteArrayAsync());
        }

        [Fact]
        public async Task Attachment_ExecutableFile_IsRejected()
        {
            var client = await AuthenticatedClientAsync(UniqueName("exe"));
            var chat = await CreateChatAsync(client, "Exe chat");

            var upload = await client.PostAsync($"/api/Message/{chat.Id}/attachments",
                FileForm("virus.exe", new byte[] { 1, 2, 3 }, "application/octet-stream"));

            Assert.Equal(HttpStatusCode.BadRequest, upload.StatusCode);
        }

        [Fact]
        public async Task Attachment_ForForeignChat_IsForbidden()
        {
            var owner = await AuthenticatedClientAsync(UniqueName("attown"));
            var chat = await CreateChatAsync(owner, "Closed chat");

            var outsider = await AuthenticatedClientAsync(UniqueName("attout"));
            var upload = await outsider.PostAsync($"/api/Message/{chat.Id}/attachments",
                FileForm("note.txt", new byte[] { 1 }, "text/plain"));

            Assert.Equal(HttpStatusCode.Forbidden, upload.StatusCode);
        }

        [Fact]
        public async Task Attachment_CannotBeReusedByAnotherUser()
        {
            var first = await AuthenticatedClientAsync(UniqueName("attmine"));
            var chat = await CreateChatAsync(first, "Shared chat");
            var upload = await first.PostAsync($"/api/Message/{chat.Id}/attachments",
                FileForm("mine.txt", new byte[] { 7 }, "text/plain"));
            upload.EnsureSuccessStatusCode();
            var attachment = await upload.Content.ReadFromJsonAsync<MessageAttachmentDto>();

            var second = await AuthenticatedClientAsync(UniqueName("attthief"));
            var ownChat = await CreateChatAsync(second, "Thief chat");
            var stolen = await second.PostAsJsonAsync($"/api/Message/{ownChat.Id}/messages",
                new { content = "Чужое вложение", attachmentIds = new[] { attachment!.Id } });

            Assert.Equal(HttpStatusCode.BadRequest, stolen.StatusCode);
        }

        [Fact]
        public async Task Attachment_KeepsCyrillicFileName()
        {
            var client = await AuthenticatedClientAsync(UniqueName("cyr"));
            var chat = await CreateChatAsync(client, "Cyrillic chat");
            const string fileName = "Отчёт за квартал.pdf";

            var upload = await client.PostAsync($"/api/Message/{chat.Id}/attachments",
                FileForm(fileName, System.Text.Encoding.UTF8.GetBytes("%PDF-1.4"), "application/pdf"));
            upload.EnsureSuccessStatusCode();
            var attachment = await upload.Content.ReadFromJsonAsync<MessageAttachmentDto>();

            Assert.Equal(fileName, attachment!.FileName);

            var download = await client.GetAsync($"/api/Message/attachments/{attachment.Id}");
            download.EnsureSuccessStatusCode();

            var disposition = download.Content.Headers.ContentDisposition;
            Assert.Equal(fileName, disposition!.FileNameStar);
        }
    }
}
