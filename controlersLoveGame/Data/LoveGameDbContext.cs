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
        public DbSet<Feedback> Feedback { get; set; }
        public DbSet<Admin> Admins { get; set; }


    }
}
