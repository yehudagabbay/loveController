using System.ComponentModel.DataAnnotations;

namespace controlersLoveGame.Models
{
    public class PerfectDateCardTranslation
    {
        [Key]
        public int PerfectDateCardTranslationID { get; set; }

        [Required]
        public int PerfectDateCardID { get; set; }

        [Required]
        [MaxLength(10)]
        public string LanguageCode { get; set; } = string.Empty;

        [MaxLength(80)]
        public string? User1BackLabel { get; set; }

        [MaxLength(80)]
        public string? User1Label { get; set; }

        public string? User1Text { get; set; }

        [MaxLength(80)]
        public string? User2BackLabel { get; set; }

        [MaxLength(80)]
        public string? User2Label { get; set; }

        public string? User2Text { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public PerfectDateCard? PerfectDateCard { get; set; }
    }
}
