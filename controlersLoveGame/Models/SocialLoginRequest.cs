namespace controlersLoveGame.Models
{
    public class SocialLoginRequest
    {
        public string IdToken { get; set; } // 🔹 הטוקן של Firebase
        public string Email { get; set; }
        public string Nickname { get; set; }
        public string Gender { get; set; }
        public int? Age { get; set; }
    }
}
