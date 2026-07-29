using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace Services.Cryptography
{
    public sealed class AesGcmCipher : IMessageCipher, IFileCipher
    {
        private const int KeySizeBytes = 32;
        private const int NonceSizeBytes = 12;
        private const int TagSizeBytes = 16;

        private readonly byte[] _key;

        public AesGcmCipher(IConfiguration configuration)
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

            return Convert.ToBase64String(Encrypt(Encoding.UTF8.GetBytes(plaintext)));
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

            return Encoding.UTF8.GetString(Decrypt(input));
        }

        public byte[] Encrypt(byte[] plaintext)
        {
            ArgumentNullException.ThrowIfNull(plaintext);

            var nonce = RandomNumberGenerator.GetBytes(NonceSizeBytes);
            var ciphertext = new byte[plaintext.Length];
            var tag = new byte[TagSizeBytes];

            using (var aes = new AesGcm(_key, TagSizeBytes))
            {
                aes.Encrypt(nonce, plaintext, ciphertext, tag);
            }

            var output = new byte[NonceSizeBytes + TagSizeBytes + ciphertext.Length];
            Buffer.BlockCopy(nonce, 0, output, 0, NonceSizeBytes);
            Buffer.BlockCopy(tag, 0, output, NonceSizeBytes, TagSizeBytes);
            Buffer.BlockCopy(ciphertext, 0, output, NonceSizeBytes + TagSizeBytes, ciphertext.Length);

            return output;
        }

        public byte[] Decrypt(byte[] input)
        {
            ArgumentNullException.ThrowIfNull(input);

            if (input.Length < NonceSizeBytes + TagSizeBytes)
                throw new CryptographicException("Ciphertext is too short to be valid.");

            var nonce = new byte[NonceSizeBytes];
            var tag = new byte[TagSizeBytes];
            var ciphertext = new byte[input.Length - NonceSizeBytes - TagSizeBytes];

            Buffer.BlockCopy(input, 0, nonce, 0, NonceSizeBytes);
            Buffer.BlockCopy(input, NonceSizeBytes, tag, 0, TagSizeBytes);
            Buffer.BlockCopy(input, NonceSizeBytes + TagSizeBytes, ciphertext, 0, ciphertext.Length);

            var plaintext = new byte[ciphertext.Length];
            using (var aes = new AesGcm(_key, TagSizeBytes))
            {
                aes.Decrypt(nonce, ciphertext, tag, plaintext);
            }

            return plaintext;
        }
    }
}
