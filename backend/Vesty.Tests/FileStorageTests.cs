using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;
using Services.Cryptography;
using Services.Storage;
using Testcontainers.Minio;

namespace Vesty.Tests
{
    public class FileStorageTests : IAsyncLifetime
    {
        private const string EncryptionKey = "dmVzdHktdW5pdC10ZXN0LWtleS0wMDAwMDAwMDAwMDE=";
        private const string Bucket = "test-attachments";

        private readonly MinioContainer _storage = new MinioBuilder().Build();

        private MinioFileStorage _fileStorage = null!;
        private IMinioClient _rawClient = null!;

        public async Task InitializeAsync()
        {
            await _storage.StartAsync();

            var endpoint = new Uri(_storage.GetConnectionString()).Authority;
            var options = Options.Create(new StorageOptions
            {
                Endpoint = endpoint,
                AccessKey = _storage.GetAccessKey(),
                SecretKey = _storage.GetSecretKey(),
                Bucket = Bucket,
                UseSsl = false
            });

            var cipher = new AesGcmCipher(new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["MessageEncryption:Key"] = EncryptionKey
                })
                .Build());

            _fileStorage = new MinioFileStorage(options, cipher);

            _rawClient = new MinioClient()
                .WithEndpoint(endpoint)
                .WithCredentials(_storage.GetAccessKey(), _storage.GetSecretKey())
                .WithSSL(false)
                .Build();
        }

        public async Task DisposeAsync() => await _storage.DisposeAsync();

        [Fact]
        public async Task PutThenGet_ReturnsOriginalBytes()
        {
            var original = Encoding.UTF8.GetBytes("Содержимое файла с кириллицей и emoji 🔥");

            var key = await _fileStorage.PutAsync(original, "text/plain");
            var restored = await _fileStorage.GetAsync(key);

            Assert.Equal(original, restored);
        }

        [Fact]
        public async Task PutAsync_StoresEncryptedContent()
        {
            const string secret = "this must not be readable in storage";
            var key = await _fileStorage.PutAsync(Encoding.UTF8.GetBytes(secret), "text/plain");

            using var buffer = new MemoryStream();
            await _rawClient.GetObjectAsync(new GetObjectArgs()
                .WithBucket(Bucket)
                .WithObject(key)
                .WithCallbackStream(stream => stream.CopyTo(buffer)));

            var stored = Encoding.UTF8.GetString(buffer.ToArray());

            Assert.DoesNotContain(secret, stored);
        }

        [Fact]
        public async Task PutAsync_GeneratesUniqueKeys()
        {
            var content = new byte[] { 1, 2, 3 };

            var first = await _fileStorage.PutAsync(content, "application/octet-stream");
            var second = await _fileStorage.PutAsync(content, "application/octet-stream");

            Assert.NotEqual(first, second);
        }

        [Fact]
        public async Task DeleteAsync_RemovesObject()
        {
            var key = await _fileStorage.PutAsync(new byte[] { 9, 9, 9 }, "application/octet-stream");

            await _fileStorage.DeleteAsync(key);

            await Assert.ThrowsAnyAsync<Exception>(() => _fileStorage.GetAsync(key));
        }

        [Fact]
        public async Task GetAsync_ForMissingKey_Throws()
        {
            await Assert.ThrowsAnyAsync<Exception>(() => _fileStorage.GetAsync("no/such/object"));
        }
    }
}
