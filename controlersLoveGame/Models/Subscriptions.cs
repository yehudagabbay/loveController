namespace controlersLoveGame.Models
{
    public class Subscription
    {
        public int SubscriptionID { get; set; }

        public int UserID { get; set; }
        public User User { get; set; } = null!;

        public int PlanID { get; set; }
        public SubscriptionPlan SubscriptionPlan { get; set; } = null!;

        public string Store { get; set; } = null!;
        public string ProductId { get; set; } = null!;

        public string? PurchaseToken { get; set; }
        public string? TransactionId { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public bool IsActive { get; set; }
        public bool AutoRenewing { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
