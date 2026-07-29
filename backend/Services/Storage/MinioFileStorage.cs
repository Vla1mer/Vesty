using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;
using Services.Cryptography;

namespace Services.Storage
{
    public sealed class MinioFileStorage : IFileStorage
    {
        private const string EncryptedContentType = "application/octet-stream";

        private readonly IMinioClient _client;
        private readonly IFileCipher _cipher;
        private readonly string _bucket;

        public MinioFileStorage(IOptions<StorageOptions> options, IFileCipher cipher)
        {
            var settings = options.Value;
            _bucket = settings.Bucket;
            _cipher = cipher;

            _client = new MinioClient()
                .WithEndpoint(settings.Endpoint)
                .WithCredentials(settings.AccessKey, settings.SecretKey)
                .WithSSL(settings.UseSsl)
                .Build();
        }

        public async Task<string> PutAsync(byte[] content, string contentType,
            CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(content);

            await EnsureBucketAsync(cancellationToken);

            var key = $"{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid():N}";
            var encrypted = _cipher.Encrypt(content);

            using var stream = new MemoryStream(encrypted);
            await _client.PutObjectAsync(new PutObjectArgs()
                .WithBucket(_bucket)
                .WithObject(key)
                .WithStreamData(stream)
                .WithObjectSize(encrypted.Length)
                .WithContentType(EncryptedContentType), cancellationToken);

            return key;
        }

        public async Task<byte[]> GetAsync(string key, CancellationToken cancellationToken = default)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(key);

            using var buffer = new MemoryStream();
            await _client.GetObjectAsync(new GetObjectArgs()
                .WithBucket(_bucket)
                .WithObject(key)
                .WithCallbackStream(stream => stream.CopyTo(buffer)), cancellationToken);

            return _cipher.Decrypt(buffer.ToArray());
        }

        public async Task DeleteAsync(string key, CancellationToken cancellationToken = default)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(key);

            await _client.RemoveObjectAsync(new RemoveObjectArgs()
                .WithBucket(_bucket)
                .WithObject(key), cancellationToken);
        }

        private async Task EnsureBucketAsync(CancellationToken cancellationToken)
        {
            var exists = await _client.BucketExistsAsync(
                new BucketExistsArgs().WithBucket(_bucket), cancellationToken);

            if (exists)
                return;

            try
            {
                await _client.MakeBucketAsync(
                    new MakeBucketArgs().WithBucket(_bucket), cancellationToken);
            }
            catch (Exception)
            {
                var createdConcurrently = await _client.BucketExistsAsync(
                    new BucketExistsArgs().WithBucket(_bucket), cancellationToken);

                if (!createdConcurrently)
                    throw;
            }
        }
    }
}
