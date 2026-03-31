using controlersLoveGame.Models;
using System.ComponentModel.DataAnnotations;

namespace controlersLoveGame
{
    public class CardTranslation
    {
        [Key]
        public int TranslationID { get; set; }
        public int CardID { get; set; }
        public string LanguageCode { get; set; }
        public string CardText { get; set; }
        public DateTime CreatedAt { get; set; }

        public Card Card { get; set; }

    }
}
