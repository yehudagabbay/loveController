using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace controlersLoveGame.Models
{
    public class Feedback
    {
        [Key]
        public int FeedbackID { get; set; }

        [Required]
        public int UserID { get; set; }  // מזהה המשתמש ששלח את המשוב

        public int? CardID { get; set; } // יכול להיות NULL עבור משוב כללי

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; } // דירוג בין 1 ל-5

        public string? Comment { get; set; } // תוכן המשוב

        public DateTime FeedbackDate { get; set; } = DateTime.UtcNow;

        // ✅ הופכים את User ל-nullable ומוסיפים JsonIgnore
        [JsonIgnore]
        public User? User { get; set; }

        [JsonIgnore]
        public Card? Card { get; set; } // קשר אופציונלי לכרטיס
    }
}
