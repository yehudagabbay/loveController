namespace controlersLoveGame.Models
{
    public class Subscription
    {
        public int SubscriptionID { get; set; }
        public int UserID { get; set; }
        public int PlanID { get; set; }
        public string? Store { get; set; }
        public string? ProductId { get; set; }
        public string? PurchaseToken { get; set; }
        public string? TransactionId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
        public bool AutoRenewing { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public User? User { get; set; }
        public SubscriptionPlan? SubscriptionPlan { get; set; }
    }
}
