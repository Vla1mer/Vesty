using System.Net.Http.Json;

namespace Vesty.Tests
{
    public static class FriendshipSetup
    {
        public static async Task BefriendAsync(
            HttpClient requester, int requesterId, HttpClient addressee, int addresseeId)
        {
            (await requester.PostAsync($"/api/Friend/{addresseeId}", null))
                .EnsureSuccessStatusCode();
            (await addressee.PostAsync($"/api/Friend/{requesterId}/accept", null))
                .EnsureSuccessStatusCode();
        }
    }
}
