using internship.Models;
using Microsoft.EntityFrameworkCore;

namespace internship
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Chat> Chats { get; set; }
        public DbSet<ChatMember> ChatMembers { get; set; }
        public DbSet<Message> Messages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(e => {
                e.HasKey(u => u.Id);
                e.Property(u => u.Login).HasMaxLength(50).IsRequired();
                e.HasIndex(u => u.Login).IsUnique();
                e.Property(u => u.Password).HasMaxLength(255).IsRequired();
                e.Property(u => u.Name).HasMaxLength(100);
                e.Property(u => u.Surname).HasMaxLength(100);
                e.Property(u => u.Phone).HasMaxLength(20);
                e.Property(u => u.CreatedAt);
            });

            modelBuilder.Entity<Chat>(e => {
                e.HasKey(c => c.Id);
                e.Property(c => c.Name).HasMaxLength(200).IsRequired();
                e.Property(c => c.CreatedAt);
                e.HasOne(c => c.Creator)
                 .WithMany(u => u.CreatedChats)
                 .HasForeignKey(c => c.CreatorId)
                 .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<ChatMember>(e => {
                e.HasKey(cm => new { cm.ChatId, cm.UserId });
                e.Property(cm => cm.CreatedAt);
                e.HasOne(cm => cm.Chat)
                 .WithMany(c => c.ChatMembers)
                 .HasForeignKey(cm => cm.ChatId);
                e.HasOne(cm => cm.User)
                 .WithMany(u => u.ChatMembers)
                 .HasForeignKey(cm => cm.UserId);
            });

            modelBuilder.Entity<Message>(e => {
                e.HasKey(m => m.Id);
                e.Property(m => m.CreatedAt);
                e.HasOne(m => m.Chat)
                 .WithMany(c => c.Messages)
                 .HasForeignKey(m => m.ChatId);
                e.HasOne(m => m.User)
                 .WithMany(u => u.Messages)
                 .HasForeignKey(m => m.UserId);
            });
        }
    }
}