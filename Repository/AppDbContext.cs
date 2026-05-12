using Entities.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Repository
{
    public class AppDbContext : IdentityDbContext<User, IdentityRole<int>, int>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Chat> Chats { get; set; }
        public DbSet<ChatMember> ChatMembers { get; set; }
        public DbSet<Message> Messages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Ignore<IdentityRole<int>>();
            modelBuilder.Ignore<IdentityUserRole<int>>();
            modelBuilder.Ignore<IdentityRoleClaim<int>>();
            modelBuilder.Ignore<IdentityUserClaim<int>>();
            modelBuilder.Ignore<IdentityUserLogin<int>>();
            modelBuilder.Ignore<IdentityUserToken<int>>();

            modelBuilder.Entity<User>(e => {
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
                e.HasKey(cm => cm.Id);
                e.Property(cm => cm.Id).ValueGeneratedOnAdd();
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

            modelBuilder.Entity<Chat>().HasData(
                new Chat
                {
                    Id = 1,
                    Name = "Общий чат",
                    CreatorId = null,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );
        }
    }
}