using Shared.Exceptions;

namespace Services
{
    internal static class AttachmentContent
    {
        public const int MaxSizeInBytes = 10 * 1024 * 1024;
        public const int MaxPerMessage = 10;

        private static readonly char[] DirectorySeparators = ['/', '\\'];

        private static readonly HashSet<string> BlockedExtensions =
            new(StringComparer.OrdinalIgnoreCase)
            {
                ".exe", ".bat", ".cmd", ".com", ".msi", ".scr", ".ps1", ".sh", ".vbs", ".jar"
            };

        public static string NormalizeFileName(string? fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName))
                throw new InvalidAttachmentException("file name is required.");

            var separator = fileName.LastIndexOfAny(DirectorySeparators);
            var name = (separator >= 0 ? fileName[(separator + 1)..] : fileName).Trim();

            if (name.Length == 0 || name == "." || name == "..")
                throw new InvalidAttachmentException("file name is required.");

            return name;
        }

        public static void EnsureValid(string fileName, long length)
        {
            if (length <= 0)
                throw new InvalidAttachmentException("file is empty.");
            if (length > MaxSizeInBytes)
                throw new InvalidAttachmentException($"maximum size is {MaxSizeInBytes / (1024 * 1024)} MB.");
            if (BlockedExtensions.Contains(Path.GetExtension(fileName)))
                throw new InvalidAttachmentException("executable files are not allowed.");
        }

        public static async Task<byte[]> ReadAsync(Stream content)
        {
            using var buffer = new MemoryStream();
            var chunk = new byte[81920];
            int read;

            while ((read = await content.ReadAsync(chunk)) > 0)
            {
                if (buffer.Length + read > MaxSizeInBytes)
                    throw new InvalidAttachmentException(
                        $"maximum size is {MaxSizeInBytes / (1024 * 1024)} MB.");

                await buffer.WriteAsync(chunk.AsMemory(0, read));
            }

            return buffer.ToArray();
        }
    }
}
