using System.ComponentModel.DataAnnotations;

namespace controlersLoveGame.Models
{
    public class PerfectDateTask
    {
        [Key]
        public int PerfectDateTaskID { get; set; }

        [Required]
        public int PerfectDateID { get; set; }

        public int SequenceNumber { get; set; }

        [Required]
        [MaxLength(30)]
        public string TaskType { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string AudienceMode { get; set; } = string.Empty;

        public int? PerfectDateCardID { get; set; }

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

        public bool IsRevealed { get; set; }

        public DateTime? RevealedAt { get; set; }

        public DateTime? User1RevealReadyAt { get; set; }

        public DateTime? User2RevealReadyAt { get; set; }

        public DateTime? User1CompletedAt { get; set; }

        public DateTime? User2CompletedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public PerfectDate? PerfectDate { get; set; }

        public PerfectDateCard? PerfectDateCard { get; set; }
    }
}
