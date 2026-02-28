using System.ComponentModel.DataAnnotations;

namespace controlersLoveGame.Models
{
    public class PasswordResetConfirmDto
    {
        [EmailAddress]
        public string? Email { get; set; }

        public string? Token { get; set; }   

        public string? NewPassword { get; set; }
    }
}
