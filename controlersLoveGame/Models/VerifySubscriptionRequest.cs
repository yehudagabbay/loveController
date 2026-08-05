namespace controlersLoveGame.Models
{
    public class VerifySubscriptionRequest
    {
        public int UserID { get; set; }

        public string ProductId { get; set; } = string.Empty;

        public string PurchaseToken { get; set; } = string.Empty;

        public string TransactionId { get; set; } = string.Empty;

        public string Store { get; set; } = "GOOGLE_PLAY";
    }
}