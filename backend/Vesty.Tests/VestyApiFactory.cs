using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Testcontainers.PostgreSql;

namespace Vesty.Tests
{
    public class VestyApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
    {
        private const string SecretKey = "vesty-integration-tests-secret-key-0001";
        private const string EncryptionKey = "dmVzdHktdW5pdC10ZXN0LWtleS0wMDAwMDAwMDAwMDE=";

        private readonly PostgreSqlContainer _database = new PostgreSqlBuilder()
            .WithImage("postgres:17-alpine")
            .WithDatabase("vesty_tests")
            .WithUsername("vesty")
            .WithPassword("vesty")
            .Build();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
        }

        public async Task InitializeAsync()
        {
            await _database.StartAsync();

            Environment.SetEnvironmentVariable(
                "ConnectionStrings__DefaultConnection", _database.GetConnectionString());
            Environment.SetEnvironmentVariable("UseHttpsRedirection", "false");
            Environment.SetEnvironmentVariable("Cors__AllowedOrigins__0", "http://localhost:5173");
            Environment.SetEnvironmentVariable("JwtSettings__validIssuer", "VestyTests");
            Environment.SetEnvironmentVariable("JwtSettings__validAudience", "http://localhost");
            Environment.SetEnvironmentVariable("JwtSettings__expires", "60");
            Environment.SetEnvironmentVariable("JwtSettings__secretKey", SecretKey);
            Environment.SetEnvironmentVariable("MessageEncryption__Key", EncryptionKey);
        }

        public new async Task DisposeAsync()
        {
            await _database.DisposeAsync();
            await base.DisposeAsync();
        }
    }
}
