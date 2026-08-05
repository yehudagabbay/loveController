using System.ComponentModel.DataAnnotations;

namespace controlersLoveGame.Models
{
    public class CreatePerfectDateRequest
    {
        public int? UserID { get; set; }

        public DateTime? ScheduledAt { get; set; }
    }

    public class JoinPerfectDateRequest
    {
        [Required]
        [MaxLength(12)]
        public string DateNumber { get; set; } = string.Empty;

        public int? UserID { get; set; }
    }

    public class SavePerfectDateSetupRequest
    {
        [Required]
        [MaxLength(12)]
        public string DateNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(120)]
        public string AccessToken { get; set; } = string.Empty;

        public int? UserID { get; set; }

        [MaxLength(10)]
        public string? ParticipantRole { get; set; }

        [Required]
        [MaxLength(20)]
        public string Gender { get; set; } = string.Empty;

        public int? Age { get; set; }

        [MaxLength(20)]
        public string? Location { get; set; }

        [MaxLength(30)]
        public string? Vibe { get; set; }

        [MaxLength(50)]
        public string? Goal { get; set; }

        [MaxLength(30)]
        public string? ExactLocation { get; set; }

        public bool LimitNoWorkAndMoney { get; set; }

        public bool LimitNoFutureTalk { get; set; }

        public bool LimitNoHeavyPast { get; set; }

        public bool LimitNoPhysical { get; set; }
    }

    public class PerfectDateDeckRequest
    {
        [Required]
        [MaxLength(12)]
        public string DateNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(120)]
        public string AccessToken { get; set; } = string.Empty;

        public int? UserID { get; set; }

        [MaxLength(10)]
        public string? ParticipantRole { get; set; }

        [MaxLength(5)]
        public string LanguageCode { get; set; } = "he";
    }

    public class PerfectDateSyncStateRequest : PerfectDateDeckRequest
    {
    }

    public class PerfectDateTaskReadyRequest : PerfectDateDeckRequest
    {
        public int PerfectDateTaskID { get; set; }
    }

    public class PerfectDateTaskRevealReadyRequest : PerfectDateDeckRequest
    {
        public int PerfectDateTaskID { get; set; }
    }

    public class PerfectDateSyncStateResponse
    {
        public int? CurrentTaskID { get; set; }

        public int CurrentSequenceNumber { get; set; }

        public int TotalTasks { get; set; }

        public bool CurrentUserReady { get; set; }

        public bool PartnerReady { get; set; }

        public bool CurrentUserRevealReady { get; set; }

        public bool PartnerRevealReady { get; set; }

        public bool IsCurrentTaskRevealed { get; set; }

        public bool IsCompleted { get; set; }
    }

    public class PerfectDateDeckCardResponse
    {
        public int PerfectDateTaskID { get; set; }

        public int SequenceNumber { get; set; }

        public int CardID { get; set; }

        public int CardType { get; set; }

        public int AllowedLocation { get; set; }

        public string BackLabel { get; set; } = string.Empty;

        public string Label { get; set; } = string.Empty;

        public string ContentText { get; set; } = string.Empty;

        public string? ContentMaleSecret { get; set; }

        public string? ContentFemaleSecret { get; set; }

        public string CurrentUserGender { get; set; } = string.Empty;

        public bool IsSecret { get; set; }
    }

    public class PerfectDateInviteResponse
    {
        public int PerfectDateID { get; set; }

        public string DateNumber { get; set; } = string.Empty;

        public string ParticipantRole { get; set; } = string.Empty;

        public string ParticipantAccessToken { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public string DeepLink { get; set; } = string.Empty;

        public string WebInviteLink { get; set; } = string.Empty;

        public string ShareMessage { get; set; } = string.Empty;
    }
}
