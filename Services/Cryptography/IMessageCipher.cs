namespace Services.Cryptography
{
    public interface IMessageCipher
    {
        string Encrypt(string plaintext);
        string Decrypt(string ciphertext);
    }
}
