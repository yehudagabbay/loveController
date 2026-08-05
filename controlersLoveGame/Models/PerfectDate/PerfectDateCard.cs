using System.ComponentModel.DataAnnotations;

namespace controlersLoveGame.Models
{
    public class PerfectDateCard
    {
        [Key]
        public int PerfectDateCardID { get; set; }

        [Required]
        [MaxLength(80)]
        public string CardCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(10)]
        public string LanguageCode { get; set; } = "he";

        [Required]
        [MaxLength(30)]
        public string TaskType { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string AudienceMode { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? Location { get; set; }

        [MaxLength(30)]
        public string? Vibe { get; set; }

        [MaxLength(50)]
        public string? Goal { get; set; }

        [MaxLength(80)]
        public string? BoundaryKey { get; set; }

        public int SortOrder { get; set; }

        [MaxLength(80)]
        public string? User1BackLabel { get; set; }

        [MaxLength(80)]
        public string? User1Label { get; set; }

        public string? User1Text { get; set; }

        public bool IsUser1Secret { get; set; }

        [MaxLength(80)]
        public string? User2BackLabel { get; set; }

        [MaxLength(80)]
        public string? User2Label { get; set; }

        public string? User2Text { get; set; }

        public bool IsUser2Secret { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public ICollection<PerfectDateTask> Tasks { get; set; } = new List<PerfectDateTask>();

        public ICollection<PerfectDateCardTranslation> Translations { get; set; } = new List<PerfectDateCardTranslation>();
    }
}
