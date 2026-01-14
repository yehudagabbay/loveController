using System.ComponentModel.DataAnnotations;

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
    }
}
