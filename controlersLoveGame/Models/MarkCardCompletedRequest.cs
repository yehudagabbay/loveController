namespace controlersLoveGame.Models
{
    public class MarkCardCompletedRequest
    {
        public int UserID { get; set; }
        public int CardID { get; set; }

        // אופציונלי – אם אתה רוצה להשאיר אותו גנרי
        public bool IsCompleted { get; set; } = true;

        // אופציונלי
        public int LikeStatus { get; set; } = 0;
    }
}
