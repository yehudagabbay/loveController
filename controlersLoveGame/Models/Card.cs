using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace controlersLoveGame.Models
{
    public class Card
    {
        [Key]
        public int CardID { get; set; }

        [Required]
        public int CategoryID { get; set; }

        [Required]
        public int LevelID { get; set; }

        [Required]
        public string CardDescription { get; set; }

        public bool IsActive { get; set; } = true;
        // מצב משחק: 1=זוגי, 2=משפחה, 3=חברים/משרד
        [Required]
        public int ModeID { get; set; } = 1;

        public int? CardType { get; set; }

        public int? AllowedLocation { get; set; }

        public bool IsWorkAndMoney { get; set; }

        public bool IsFutureTalk { get; set; }

        public bool IsHeavyPast { get; set; }

        public bool IsPhysical { get; set; }

        [NotMapped]
        public int? BookID { get; set; }

        [NotMapped]
        public int? SubCategoryID { get; set; }

        [NotMapped]
        public int LikeStatus { get; set; } = 0;

        [NotMapped]
        public bool HasFeedback { get; set; }

        [NotMapped]
        public bool IsShared { get; set; }
    }
}
