namespace controlersLoveGame.Models
{
    // בקשת רכישה שמגיעה מהלקוח אחרי תשלום/אישור בחנות.
    public class PurchaseSubscriptionRequest
    {
        public int UserID { get; set; }
        public int PlanID { get; set; }
        public string Store { get; set; } = string.Empty;
        public string ProductId { get; set; } = string.Empty;
        public string? PurchaseToken { get; set; }
        public string? TransactionId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool AutoRenewing { get; set; }
    }
}
