namespace Services.Cryptography
{
    public interface IFileCipher
    {
        byte[] Encrypt(byte[] plaintext);
        byte[] Decrypt(byte[] ciphertext);
    }
}
