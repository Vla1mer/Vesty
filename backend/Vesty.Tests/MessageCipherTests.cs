using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;
using Services.Cryptography;

namespace Vesty.Tests
{
    public class MessageCipherTests
    {
        private const string ValidKey = "dmVzdHktdW5pdC10ZXN0LWtleS0wMDAwMDAwMDAwMDE=";

        private static AesGcmMessageCipher CipherWith(string? key)
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["MessageEncryption:Key"] = key
                })
                .Build();

            return new AesGcmMessageCipher(configuration);
        }

        private static AesGcmMessageCipher Cipher() => CipherWith(ValidKey);

        [Theory]
        [InlineData("Hello")]
        [InlineData("Привет, как дела?")]
        [InlineData("Emoji 🔥 and symbols <>&\"'")]
        [InlineData("")]
        public void EncryptThenDecrypt_ReturnsOriginalText(string plaintext)
        {
            var cipher = Cipher();

            var restored = cipher.Decrypt(cipher.Encrypt(plaintext));

            Assert.Equal(plaintext, restored);
        }

        [Fact]
        public void Encrypt_DoesNotLeakPlaintext()
        {
            var cipher = Cipher();
            const string secret = "top secret message";

            var ciphertext = cipher.Encrypt(secret);

            Assert.DoesNotContain(secret, ciphertext);
        }

        [Fact]
        public void Encrypt_SameTextTwice_ProducesDifferentCiphertext()
        {
            var cipher = Cipher();
            const string text = "repeated message";

            Assert.NotEqual(cipher.Encrypt(text), cipher.Encrypt(text));
        }

        [Fact]
        public void Decrypt_WithDifferentKey_Throws()
        {
            var ciphertext = Cipher().Encrypt("secret");
            var other = CipherWith("YW5vdGhlci11bml0LXRlc3Qta2V5LTAwMDAwMDAwMDI=");

            Assert.ThrowsAny<CryptographicException>(() => other.Decrypt(ciphertext));
        }

        [Fact]
        public void Decrypt_WithInvalidBase64_Throws()
        {
            Assert.Throws<CryptographicException>(() => Cipher().Decrypt("not base64 at all!"));
        }

        [Fact]
        public void Decrypt_WithTruncatedCiphertext_Throws()
        {
            var truncated = Convert.ToBase64String(new byte[8]);

            Assert.Throws<CryptographicException>(() => Cipher().Decrypt(truncated));
        }

        [Fact]
        public void Decrypt_WithTamperedCiphertext_Throws()
        {
            var bytes = Convert.FromBase64String(Cipher().Encrypt("secret"));
            bytes[^1] ^= 0xFF;

            Assert.ThrowsAny<CryptographicException>(() =>
                Cipher().Decrypt(Convert.ToBase64String(bytes)));
        }

        [Fact]
        public void Constructor_WithoutKey_Throws()
        {
            Assert.Throws<InvalidOperationException>(() => CipherWith(null));
        }

        [Fact]
        public void Constructor_WithBlankKey_Throws()
        {
            Assert.Throws<InvalidOperationException>(() => CipherWith("   "));
        }
    }
}
