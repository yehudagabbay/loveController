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
        public bool EmailVerified { get; set; } = false;
        public string? EmailVerificationToken { get; set; }
        public DateTime? EmailVerificationExpiry { get; set; }
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetExpiry { get; set; }



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
