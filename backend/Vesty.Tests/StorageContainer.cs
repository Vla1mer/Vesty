using System.Net;
using Testcontainers.Minio;

namespace Vesty.Tests
{
    public static class StorageContainer
    {
        private const string Image = "bitnamilegacy/minio:2025.7.23-debian-12-r5";

        public static MinioContainer Create() =>
            new MinioBuilder(Image).WithTmpfsMount("/data").Build();

        public static async Task StartAsync(MinioContainer storage)
        {
            await storage.StartAsync();

            using var http = new HttpClient();
            for (var attempt = 0; attempt < 150; attempt++)
            {
                var answer = await http.GetAsync(storage.GetConnectionString());
                if (answer.StatusCode != HttpStatusCode.ServiceUnavailable) return;
                await Task.Delay(200);
            }

            throw new TimeoutException("The storage never finished starting up.");
        }
    }
}
