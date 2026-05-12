using System.Security.Cryptography;
using System.Text;

namespace controlersLoveGame.Services.Admin
{
    public class AdminSessionTokenService
    {
        public string GenerateToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToBase64String(bytes);
        }

        public string HashToken(string token)
        {
            var bytes = Encoding.UTF8.GetBytes(token);
            var hash = SHA256.HashData(bytes);
            return Convert.ToHexString(hash);
        }
    }
}
