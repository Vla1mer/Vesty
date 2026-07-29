using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Testcontainers.Minio;
using Testcontainers.PostgreSql;

namespace Vesty.Tests
{
    public class VestyApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
    {
        private const string SecretKey = "vesty-integration-tests-secret-key-0001";
        private const string EncryptionKey = "dmVzdHktdW5pdC10ZXN0LWtleS0wMDAwMDAwMDAwMDE=";

        private readonly PostgreSqlContainer _database = new PostgreSqlBuilder("postgres:17-alpine")
            .WithImage("postgres:17-alpine")
            .WithDatabase("vesty_tests")
            .WithUsername("vesty")
            .WithPassword("vesty")
            .Build();

        private readonly MinioContainer _storage = new MinioBuilder("minio/minio:RELEASE.2024-01-16T16-07-38Z").Build();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
        }

        public async Task InitializeAsync()
        {
            await Task.WhenAll(_database.StartAsync(), _storage.StartAsync());

            Environment.SetEnvironmentVariable(
                "ConnectionStrings__DefaultConnection", _database.GetConnectionString());
            Environment.SetEnvironmentVariable("UseHttpsRedirection", "false");
            Environment.SetEnvironmentVariable("Cors__AllowedOrigins__0", "http://localhost:5173");
            Environment.SetEnvironmentVariable("JwtSettings__validIssuer", "VestyTests");
            Environment.SetEnvironmentVariable("JwtSettings__validAudience", "http://localhost");
            Environment.SetEnvironmentVariable("JwtSettings__expires", "60");
            Environment.SetEnvironmentVariable("JwtSettings__secretKey", SecretKey);
            Environment.SetEnvironmentVariable("MessageEncryption__Key", EncryptionKey);
            Environment.SetEnvironmentVariable(
                "Storage__Endpoint", new Uri(_storage.GetConnectionString()).Authority);
            Environment.SetEnvironmentVariable("Storage__AccessKey", _storage.GetAccessKey());
            Environment.SetEnvironmentVariable("Storage__SecretKey", _storage.GetSecretKey());
            Environment.SetEnvironmentVariable("Storage__Bucket", "vesty-tests");
            Environment.SetEnvironmentVariable("Storage__UseSsl", "false");
        }

        public new async Task DisposeAsync()
        {
            await _database.DisposeAsync();
            await _storage.DisposeAsync();
            await base.DisposeAsync();
        }
    }
}
