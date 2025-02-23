namespace controlersLoveGame.Models
{
    public class User
    {
        public int UserID { get; set; }

        // ✅ מזהה של Firebase - יהווה מזהה ייחודי עבור משתמשים מחוברים עם Google/Facebook
        public string? FirebaseUID { get; set; }

        // ✅ מזהה מהרשת החברתית (Google/Facebook) - אופציונלי
        public string? SocialID { get; set; }

        // ✅ נתוני המשתמש הרגילים
        public string Nickname { get; set; }
        public string Gender { get; set; }
        public string Email { get; set; }

        // ✅ אופציונלי: סיסמה תהיה `NULL` עבור משתמשים המחוברים עם רשתות חברתיות
        public string? PasswordHash { get; set; }

        public int? Age { get; set; }
        public DateTime CreationDate { get; set; } = DateTime.UtcNow;

        // ✅ פונקציה להצפנת סיסמה - תפעל רק אם יש סיסמה
        public void HashPassword()
        {
            if (!string.IsNullOrEmpty(PasswordHash))
            {
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(PasswordHash);
            }
        }
    }
}
