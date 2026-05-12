using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace controlersLoveGame.Models
{
    public class UserSharedCard
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserID { get; set; }

        [Required]
        public int CardID { get; set; }

        public DateTime SharedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public User? User { get; set; }

        [JsonIgnore]
        public Card? Card { get; set; }
    }
}
