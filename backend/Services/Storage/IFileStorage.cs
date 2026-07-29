namespace Services.Storage
{
    public interface IFileStorage
    {
        Task<string> PutAsync(byte[] content, string contentType, CancellationToken cancellationToken = default);
        Task<byte[]> GetAsync(string key, CancellationToken cancellationToken = default);
        Task DeleteAsync(string key, CancellationToken cancellationToken = default);
    }
}
