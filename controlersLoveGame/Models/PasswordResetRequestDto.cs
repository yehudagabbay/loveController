using System.ComponentModel.DataAnnotations;

namespace controlersLoveGame.Models
{
    public class PasswordResetRequestDto
    {
        [EmailAddress]
        public string? Email { get; set; }

        // מספר מיוחד (קוד זמני) – השרת יוצר ושומר, הלקוח רק יקבל בקישור
        public string? Code { get; set; }
    }
}
