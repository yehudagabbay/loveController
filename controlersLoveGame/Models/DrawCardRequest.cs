using System.ComponentModel.DataAnnotations;

namespace controlersLoveGame.Models
{
    public class DrawCardRequest
    {
        [Required]
        public List<CategoryLevelSelection> Selections { get; set; } // רשימת הבחירות

        public class CategoryLevelSelection
        {
            //  מצב משחק: 1=זוגי, 2=משפחה, 3=חברים/משרד
            public int ModeID { get; set; }  // נשלח מהקליינט
            public int CategoryID { get; set; } // מזהה הקטגוריה (סגנון)
            public int LevelID { get; set; } // מזהה רמת הקושי
            public int NumberOfCards { get; set; } // כמות הכרטיסים לבחירה
        }

    }
}
