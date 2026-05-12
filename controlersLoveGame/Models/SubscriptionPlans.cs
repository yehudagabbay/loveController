namespace controlersLoveGame.Models
{
    public class SubscriptionPlan
    {
        public int PlanID { get; set; }

        public string PlanCode { get; set; } = null!;
        public string PlanName { get; set; } = null!;
        public string? Description { get; set; }

        public int DurationDays { get; set; }

        public decimal Price { get; set; }
        public string Currency { get; set; } = null!;

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    }
}
