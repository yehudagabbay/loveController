using System.ComponentModel.DataAnnotations;

namespace controlersLoveGame.Models
{
    public class PerfectDate
    {
        [Key]
        public int PerfectDateID { get; set; }

        public int RoomCode { get; set; }

        [Required]
        [MaxLength(12)]
        public string DateNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Location { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Created";

        public int? CreatorUserID { get; set; }

        [MaxLength(100)]
        public string? CreatorAccessTokenHash { get; set; }

        [MaxLength(1)]
        public string? CreatorGender { get; set; }

        public int? JoinedUserID { get; set; }

        [MaxLength(100)]
        public string? JoinedAccessTokenHash { get; set; }

        [MaxLength(1)]
        public string? JoinedGender { get; set; }

        public int? User1ID { get; set; }

        public int? User2ID { get; set; }

        [MaxLength(20)]
        public string? User1Gender { get; set; }

        [MaxLength(20)]
        public string? User2Gender { get; set; }

        public int? User1Age { get; set; }

        public int? User2Age { get; set; }

        public bool LocationType { get; set; }

        [MaxLength(100)]
        public string SelectedVibes { get; set; } = string.Empty;

        [MaxLength(120)]
        public string SelectedGoals { get; set; } = string.Empty;

        [MaxLength(30)]
        public string ExactLocation { get; set; } = string.Empty;

        public bool LimitNoWorkAndMoney { get; set; }

        public bool LimitNoFutureTalk { get; set; }

        public bool LimitNoHeavyPast { get; set; }

        public bool LimitNoPhysical { get; set; }

        public DateTime? ScheduledAt { get; set; }

        public DateTime? StartedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public ICollection<PerfectDateTask> Tasks { get; set; } = new List<PerfectDateTask>();
    }
}
