namespace controlersLoveGame.Models
{
    public class User
    {
        public int UserID { get; set; }
        public string FirebaseUID { get; set; } // 🔥 מזהה ייחודי של Firebase (יכול להיות ריק עבור משתמשים רגילים)
        public string? SocialID { get; set; } // מזהה מהרשת החברתית (Google/Facebook)

        public string Nickname { get; set; }
        public string Gender { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public int? Age { get; set; }
        public DateTime CreationDate { get; set; } = DateTime.Now;

        public void HashPassword()
        {
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(PasswordHash);
        }
    }
}
