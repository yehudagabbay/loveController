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
        public DbSet<PerfectDate> PerfectDates { get; set; }
        public DbSet<PerfectDateCard> PerfectDateCards { get; set; }
        public DbSet<PerfectDateCardTranslation> PerfectDateCardTranslations { get; set; }
        public DbSet<PerfectDateTask> PerfectDateTasks { get; set; }

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

            modelBuilder.Entity<Card>(entity =>
            {
                entity.Property(e => e.CardType);
                entity.Property(e => e.AllowedLocation);
                entity.Property(e => e.IsWorkAndMoney)
                    .HasDefaultValue(false)
                    .IsRequired();
                entity.Property(e => e.IsFutureTalk)
                    .HasDefaultValue(false)
                    .IsRequired();
                entity.Property(e => e.IsHeavyPast)
                    .HasDefaultValue(false)
                    .IsRequired();
                entity.Property(e => e.IsPhysical)
                    .HasDefaultValue(false)
                    .IsRequired();
                entity.HasIndex(e => new { e.ModeID, e.CardType, e.AllowedLocation });
            });

            modelBuilder.Entity<CardTranslation>(entity =>
            {
                entity.Property(e => e.LanguageCode)
                    .HasMaxLength(5)
                    .IsRequired();
                entity.Property(e => e.ContentText);
                entity.Property(e => e.ContentMaleSecret);
                entity.Property(e => e.ContentFemaleSecret);
                entity.HasIndex(e => new { e.CardID, e.LanguageCode });
            });

            modelBuilder.Entity<PerfectDate>(entity =>
            {
                entity.ToTable("PerfectDates");
                entity.HasKey(e => e.PerfectDateID);

                entity.Property(e => e.RoomCode)
                    .IsRequired();

                entity.Property(e => e.DateNumber)
                    .HasMaxLength(12)
                    .IsRequired();

                entity.Property(e => e.Location)
                    .HasMaxLength(20)
                    .IsRequired();

                entity.Property(e => e.Status)
                    .HasMaxLength(30)
                    .HasDefaultValue("Created")
                    .IsRequired();

                entity.Property(e => e.CreatorGender)
                    .HasMaxLength(1);

                entity.Property(e => e.CreatorAccessTokenHash)
                    .HasMaxLength(100);

                entity.Property(e => e.JoinedGender)
                    .HasMaxLength(1);

                entity.Property(e => e.JoinedAccessTokenHash)
                    .HasMaxLength(100);

                entity.Property(e => e.User1Gender)
                    .HasMaxLength(20);

                entity.Property(e => e.User2Gender)
                    .HasMaxLength(20);

                entity.Property(e => e.User1Age);

                entity.Property(e => e.User2Age);

                entity.Property(e => e.LocationType)
                    .HasDefaultValue(false)
                    .IsRequired();

                entity.Property(e => e.SelectedVibes)
                    .HasMaxLength(100)
                    .HasDefaultValue(string.Empty)
                    .IsRequired();

                entity.Property(e => e.SelectedGoals)
                    .HasMaxLength(120)
                    .HasDefaultValue(string.Empty)
                    .IsRequired();

                entity.Property(e => e.ExactLocation)
                    .HasMaxLength(30)
                    .HasDefaultValue(string.Empty)
                    .IsRequired();

                entity.Property(e => e.LimitNoWorkAndMoney)
                    .HasDefaultValue(false)
                    .IsRequired();

                entity.Property(e => e.LimitNoFutureTalk)
                    .HasDefaultValue(false)
                    .IsRequired();

                entity.Property(e => e.LimitNoHeavyPast)
                    .HasDefaultValue(false)
                    .IsRequired();

                entity.Property(e => e.LimitNoPhysical)
                    .HasDefaultValue(false)
                    .IsRequired();

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.HasIndex(e => e.DateNumber)
                    .IsUnique();

                entity.HasIndex(e => e.RoomCode);
                entity.HasIndex(e => new { e.User1ID, e.User2ID });
                entity.HasIndex(e => new { e.CreatorUserID, e.JoinedUserID });
                entity.HasIndex(e => new { e.Status, e.ScheduledAt });
            });

            modelBuilder.Entity<PerfectDateTask>(entity =>
            {
                entity.ToTable("PerfectDateTasks");
                entity.HasKey(e => e.PerfectDateTaskID);

                entity.Property(e => e.TaskType)
                    .HasMaxLength(30)
                    .IsRequired();

                entity.Property(e => e.AudienceMode)
                    .HasMaxLength(30)
                    .IsRequired();

                entity.Property(e => e.User1BackLabel)
                    .HasMaxLength(80);

                entity.Property(e => e.User1Label)
                    .HasMaxLength(80);

                entity.Property(e => e.User2BackLabel)
                    .HasMaxLength(80);

                entity.Property(e => e.User2Label)
                    .HasMaxLength(80);

                entity.Property(e => e.IsUser1Secret)
                    .HasDefaultValue(false)
                    .IsRequired();

                entity.Property(e => e.IsUser2Secret)
                    .HasDefaultValue(false)
                    .IsRequired();

                entity.Property(e => e.IsRevealed)
                    .HasDefaultValue(false)
                    .IsRequired();

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.HasIndex(e => new { e.PerfectDateID, e.SequenceNumber })
                    .IsUnique();

                entity.HasIndex(e => new { e.PerfectDateID, e.IsRevealed });

                entity.HasIndex(e => new { e.PerfectDateID, e.User1RevealReadyAt, e.User2RevealReadyAt });

                entity.HasIndex(e => new { e.PerfectDateID, e.User1CompletedAt, e.User2CompletedAt });

                entity.HasIndex(e => e.PerfectDateCardID);

                entity.HasOne(e => e.PerfectDate)
                    .WithMany(d => d.Tasks)
                    .HasForeignKey(e => e.PerfectDateID)
                    .HasConstraintName("FK_PerfectDateTasks_PerfectDates")
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.PerfectDateCard)
                    .WithMany(c => c.Tasks)
                    .HasForeignKey(e => e.PerfectDateCardID)
                    .HasConstraintName("FK_PerfectDateTasks_PerfectDateCards")
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<PerfectDateCard>(entity =>
            {
                entity.ToTable("PerfectDateCards");
                entity.HasKey(e => e.PerfectDateCardID);

                entity.Property(e => e.CardCode)
                    .HasMaxLength(80)
                    .IsRequired();

                entity.Property(e => e.LanguageCode)
                    .HasMaxLength(10)
                    .HasDefaultValue("he")
                    .IsRequired();

                entity.Property(e => e.TaskType)
                    .HasMaxLength(30)
                    .IsRequired();

                entity.Property(e => e.AudienceMode)
                    .HasMaxLength(30)
                    .IsRequired();

                entity.Property(e => e.Location)
                    .HasMaxLength(20);

                entity.Property(e => e.Vibe)
                    .HasMaxLength(30);

                entity.Property(e => e.Goal)
                    .HasMaxLength(50);

                entity.Property(e => e.BoundaryKey)
                    .HasMaxLength(80);

                entity.Property(e => e.User1BackLabel)
                    .HasMaxLength(80);

                entity.Property(e => e.User1Label)
                    .HasMaxLength(80);

                entity.Property(e => e.User2BackLabel)
                    .HasMaxLength(80);

                entity.Property(e => e.User2Label)
                    .HasMaxLength(80);

                entity.Property(e => e.IsUser1Secret)
                    .HasDefaultValue(false)
                    .IsRequired();

                entity.Property(e => e.IsUser2Secret)
                    .HasDefaultValue(false)
                    .IsRequired();

                entity.Property(e => e.IsActive)
                    .HasDefaultValue(true)
                    .IsRequired();

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.HasIndex(e => new { e.CardCode, e.LanguageCode })
                    .IsUnique();

                entity.HasIndex(e => new { e.LanguageCode, e.IsActive });
                entity.HasIndex(e => new { e.TaskType, e.AudienceMode });
            });

            modelBuilder.Entity<PerfectDateCardTranslation>(entity =>
            {
                entity.ToTable("PerfectDateCardTranslations");
                entity.HasKey(e => e.PerfectDateCardTranslationID);

                entity.Property(e => e.LanguageCode)
                    .HasMaxLength(10)
                    .IsRequired();

                entity.Property(e => e.User1BackLabel)
                    .HasMaxLength(80);

                entity.Property(e => e.User1Label)
                    .HasMaxLength(80);

                entity.Property(e => e.User2BackLabel)
                    .HasMaxLength(80);

                entity.Property(e => e.User2Label)
                    .HasMaxLength(80);

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.HasIndex(e => new { e.PerfectDateCardID, e.LanguageCode })
                    .IsUnique();

                entity.HasOne(e => e.PerfectDateCard)
                    .WithMany(c => c.Translations)
                    .HasForeignKey(e => e.PerfectDateCardID)
                    .HasConstraintName("FK_PerfectDateCardTranslations_PerfectDateCards")
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
