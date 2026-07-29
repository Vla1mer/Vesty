using Shared.Exceptions;

namespace Services
{
    internal static class AttachmentContent
    {
        public const int MaxSizeInBytes = 10 * 1024 * 1024;
        public const int MaxPerMessage = 10;

        private static readonly HashSet<string> BlockedExtensions =
            new(StringComparer.OrdinalIgnoreCase)
            {
                ".exe", ".bat", ".cmd", ".com", ".msi", ".scr", ".ps1", ".sh", ".vbs", ".jar"
            };

        public static void EnsureValid(string? fileName, long length)
        {
            if (length <= 0)
                throw new InvalidAttachmentException("file is empty.");
            if (length > MaxSizeInBytes)
                throw new InvalidAttachmentException($"maximum size is {MaxSizeInBytes / (1024 * 1024)} MB.");
            if (string.IsNullOrWhiteSpace(fileName))
                throw new InvalidAttachmentException("file name is required.");
            if (BlockedExtensions.Contains(Path.GetExtension(fileName)))
                throw new InvalidAttachmentException("executable files are not allowed.");
        }

        public static async Task<byte[]> ReadAsync(Stream content)
        {
            using var buffer = new MemoryStream();
            await content.CopyToAsync(buffer);
            var data = buffer.ToArray();

            if (data.Length > MaxSizeInBytes)
                throw new InvalidAttachmentException($"maximum size is {MaxSizeInBytes / (1024 * 1024)} MB.");

            return data;
        }
    }
}
