using controlersLoveGame.Models;
using Microsoft.EntityFrameworkCore;

namespace controlersLoveGame.Data
{
    public class LoveGameDbContext : DbContext
    {
        public LoveGameDbContext(DbContextOptions<LoveGameDbContext> options) : base(options) { }
        public DbSet<CardTranslation> CardTranslations { get; set; }

        public DbSet<User> Users { get; set; }
        public DbSet<Card> Cards { get; set; }
        public DbSet<UserCardStatus> UserCardStatus { get; set; }
        public DbSet<UserSharedCard> UserSharedCards { get; set; }
        public DbSet<Feedback> Feedback { get; set; }
        public DbSet<Admin> Admins { get; set; }
        public DbSet<AdminSession> AdminSessions { get; set; }
        public DbSet<Subscription> Subscriptions { get; set; }
        public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<SubscriptionPlan>(entity =>
            {
                entity.ToTable("SubscriptionPlans");
                entity.HasKey(e => e.PlanID);

                entity.Property(e => e.PlanCode)
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(e => e.PlanName)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.Description)
                    .HasMaxLength(500);

                entity.Property(e => e.DurationDays)
                    .IsRequired();

                entity.Property(e => e.Price)
                    .HasPrecision(10, 2);

                entity.Property(e => e.Currency)
                    .HasMaxLength(10)
                    .HasDefaultValue("ILS")
                    .IsRequired();

                entity.Property(e => e.IsActive)
                    .HasDefaultValue(true)
                    .IsRequired();

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("GETDATE()");

                entity.HasIndex(e => e.PlanCode)
                    .IsUnique();
            });

            modelBuilder.Entity<Subscription>(entity =>
            {
                entity.ToTable("Subscriptions");
                entity.HasKey(e => e.SubscriptionID);

                entity.Property(e => e.Store)
                    .HasMaxLength(20)
                    .IsRequired();

                entity.Property(e => e.ProductId)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.TransactionId)
                    .HasMaxLength(200);

                entity.Property(e => e.IsActive)
                    .HasDefaultValue(true)
                    .IsRequired();

                entity.Property(e => e.AutoRenewing)
                    .HasDefaultValue(false)
                    .IsRequired();

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("GETDATE()");

                entity.HasIndex(e => new { e.UserID, e.IsActive, e.EndDate });
                entity.HasIndex(e => e.PlanID);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Subscriptions)
                    .HasForeignKey(e => e.UserID)
                    .HasConstraintName("FK_Subscriptions_Users")
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.SubscriptionPlan)
                    .WithMany(p => p.Subscriptions)
                    .HasForeignKey(e => e.PlanID)
                    .HasConstraintName("FK_Subscriptions_SubscriptionPlans")
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<AdminSession>(entity =>
            {
                entity.ToTable("AdminSessions");
                entity.HasKey(e => e.SessionId);

                entity.Property(e => e.TokenHash)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.Property(e => e.ExpiresAt)
                    .IsRequired();

                entity.Property(e => e.IsActive)
                    .HasDefaultValue(true)
                    .IsRequired();

                entity.HasIndex(e => e.TokenHash);
                entity.HasIndex(e => new { e.AdminId, e.IsActive, e.ExpiresAt });

                entity.HasOne(e => e.Admin)
                    .WithMany()
                    .HasForeignKey(e => e.AdminId)
                    .HasConstraintName("FK_AdminSessions_Admins")
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
