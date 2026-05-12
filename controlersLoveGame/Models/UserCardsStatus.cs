using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace controlersLoveGame.Models
{
    public class UserCardStatus
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserID { get; set; }

        [Required]
        public int CardID { get; set; }

        public bool IsCompleted { get; set; } = false;

        public int LikeStatus { get; set; } = 0;

        [JsonIgnore] // מונע הצגה של המשתמש ב-Swagger
        public User? User { get; set; }

        [JsonIgnore] // מונע הצגה של הכרטיס ב-Swagger
        public Card? Card { get; set; }
    }
}
