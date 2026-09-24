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

            EnsurePicture(data);
            return data;
        }

        private static void EnsurePicture(byte[] data)
        {
            var known = StartsWith(data, [0xFF, 0xD8, 0xFF])
                || StartsWith(data, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
                || (data.Length >= 12 && StartsWith(data, "RIFF"u8) && data.AsSpan(8, 4).SequenceEqual("WEBP"u8));

            if (!known)
                throw new InvalidAvatarException("the file is not a JPEG, PNG or WebP image.");
        }

        private static bool StartsWith(byte[] data, ReadOnlySpan<byte> signature) =>
            data.AsSpan().StartsWith(signature);
    }
}
