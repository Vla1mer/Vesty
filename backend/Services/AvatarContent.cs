using Shared.Exceptions;

namespace Services
{
    internal static class AvatarContent
    {
        public const int MaxSizeInBytes = 300 * 1024;

        private static readonly HashSet<string> AllowedContentTypes =
            new(StringComparer.OrdinalIgnoreCase) { "image/jpeg", "image/png", "image/webp" };

        public static void EnsureValid(string? contentType, long length)
        {
            if (length <= 0)
                throw new InvalidAvatarException("file is empty.");
            if (length > MaxSizeInBytes)
                throw new InvalidAvatarException($"maximum size is {MaxSizeInBytes / 1024} KB.");
            if (contentType is null || !AllowedContentTypes.Contains(contentType))
                throw new InvalidAvatarException("allowed formats are JPEG, PNG and WebP.");
        }

        public static async Task<byte[]> ReadAsync(Stream content)
        {
            using var buffer = new MemoryStream();
            await content.CopyToAsync(buffer);
            var data = buffer.ToArray();

            if (data.Length > MaxSizeInBytes)
                throw new InvalidAvatarException($"maximum size is {MaxSizeInBytes / 1024} KB.");

            return data;
        }
    }
}
