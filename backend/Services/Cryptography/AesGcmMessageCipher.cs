using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace Services.Cryptography
{
    public sealed class AesGcmMessageCipher : IMessageCipher
    {
        private const int KeySizeBytes = 32;
        private const int NonceSizeBytes = 12;
        private const int TagSizeBytes = 16;

        private readonly byte[] _key;

        public AesGcmMessageCipher(IConfiguration configuration)
        {
            var keyBase64 = configuration["MessageEncryption:Key"];
            if (string.IsNullOrWhiteSpace(keyBase64))
                throw new InvalidOperationException(
                    "MessageEncryption:Key is not configured. " +
                    "Add a base64-encoded 32-byte key under \"MessageEncryption:Key\".");

            try
            {
                _key = Convert.FromBase64String(keyBase64);
            }
            catch (FormatException ex)
            {
                throw new InvalidOperationException(
                    "MessageEncryption:Key is not valid base64.", ex);
            }

            if (_key.Length != KeySizeBytes)
                throw new InvalidOperationException(
                    $"MessageEncryption:Key must decode to {KeySizeBytes} bytes (got {_key.Length}).");
        }

        public string Encrypt(string plaintext)
        {
            ArgumentNullException.ThrowIfNull(plaintext);

            var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
            var nonce = RandomNumberGenerator.GetBytes(NonceSizeBytes);
            var ciphertext = new byte[plaintextBytes.Length];
            var tag = new byte[TagSizeBytes];

            using (var aes = new AesGcm(_key, TagSizeBytes))
            {
                aes.Encrypt(nonce, plaintextBytes, ciphertext, tag);
            }

            var output = new byte[NonceSizeBytes + TagSizeBytes + ciphertext.Length];
            Buffer.BlockCopy(nonce, 0, output, 0, NonceSizeBytes);
            Buffer.BlockCopy(tag, 0, output, NonceSizeBytes, TagSizeBytes);
            Buffer.BlockCopy(ciphertext, 0, output, NonceSizeBytes + TagSizeBytes, ciphertext.Length);

            return Convert.ToBase64String(output);
        }

        public string Decrypt(string ciphertext)
        {
            ArgumentNullException.ThrowIfNull(ciphertext);

            byte[] input;
            try
            {
                input = Convert.FromBase64String(ciphertext);
            }
            catch (FormatException ex)
            {
                throw new CryptographicException("Ciphertext is not valid base64.", ex);
            }

            if (input.Length < NonceSizeBytes + TagSizeBytes)
                throw new CryptographicException("Ciphertext is too short to be valid.");

            var nonce = new byte[NonceSizeBytes];
            var tag = new byte[TagSizeBytes];
            var actualCiphertext = new byte[input.Length - NonceSizeBytes - TagSizeBytes];

            Buffer.BlockCopy(input, 0, nonce, 0, NonceSizeBytes);
            Buffer.BlockCopy(input, NonceSizeBytes, tag, 0, TagSizeBytes);
            Buffer.BlockCopy(input, NonceSizeBytes + TagSizeBytes, actualCiphertext, 0, actualCiphertext.Length);

            var plaintextBytes = new byte[actualCiphertext.Length];
            using (var aes = new AesGcm(_key, TagSizeBytes))
            {
                aes.Decrypt(nonce, actualCiphertext, tag, plaintextBytes);
            }

            return Encoding.UTF8.GetString(plaintextBytes);
        }
    }
}
