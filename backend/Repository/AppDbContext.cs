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
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<UserAvatar> UserAvatars { get; set; }
        public DbSet<ChatAvatar> ChatAvatars { get; set; }
        public DbSet<MessageReaction> MessageReactions { get; set; }

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

            modelBuilder.Entity<UserAvatar>(e => {
                e.HasKey(a => a.UserId);
                e.Property(a => a.Data).IsRequired();
                e.Property(a => a.ContentType).HasMaxLength(50).IsRequired();
                e.HasOne(a => a.User)
                 .WithOne(u => u.Avatar)
                 .HasForeignKey<UserAvatar>(a => a.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ChatAvatar>(e => {
                e.HasKey(a => a.ChatId);
                e.Property(a => a.Data).IsRequired();
                e.Property(a => a.ContentType).HasMaxLength(50).IsRequired();
                e.HasOne(a => a.Chat)
                 .WithOne(c => c.Avatar)
                 .HasForeignKey<ChatAvatar>(a => a.ChatId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Chat>(e => {
                e.HasKey(c => c.Id);
                e.Property(c => c.Name).HasMaxLength(200);
                e.Property(c => c.CreatedAt);
                e.Property(c => c.IsPrivate).HasDefaultValue(false);
                e.HasOne(c => c.Creator)
                 .WithMany(u => u.CreatedChats)
                 .HasForeignKey(c => c.CreatorId)
                 .OnDelete(DeleteBehavior.SetNull);
                e.HasIndex(c => c.IsPrivate);
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
                e.HasOne(cm => cm.Role)
                 .WithMany(r => r.ChatMembers)
                 .HasForeignKey(cm => cm.RoleId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<UserRole>(e => {
                e.HasKey(r => r.Id);
                e.Property(r => r.Id).ValueGeneratedNever();
                e.Property(r => r.Name).HasMaxLength(50).IsRequired();
                e.HasIndex(r => r.Name).IsUnique();
            });

            modelBuilder.Entity<UserRole>().HasData(
                new UserRole { Id = UserRole.Owner, Name = nameof(UserRole.Owner) },
                new UserRole { Id = UserRole.Admin, Name = nameof(UserRole.Admin) },
                new UserRole { Id = UserRole.User,  Name = nameof(UserRole.User) }
            );

            modelBuilder.Entity<Message>(e => {
                e.HasKey(m => m.Id);
                e.Property(m => m.CreatedAt);
                e.HasOne(m => m.Chat)
                 .WithMany(c => c.Messages)
                 .HasForeignKey(m => m.ChatId);
                e.HasOne(m => m.User)
                 .WithMany(u => u.Messages)
                 .HasForeignKey(m => m.UserId);
                e.HasIndex(m => new { m.ChatId, m.PinnedAt });
                e.HasOne(m => m.ReplyToMessage)
                 .WithMany()
                 .HasForeignKey(m => m.ReplyToMessageId)
                 .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<MessageReaction>(e => {
                e.HasKey(r => new { r.MessageId, r.UserId, r.Emoji });
                e.Property(r => r.Emoji).HasMaxLength(16).IsRequired();
                e.Property(r => r.CreatedAt);
                e.HasOne(r => r.Message)
                 .WithMany(m => m.Reactions)
                 .HasForeignKey(r => r.MessageId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(r => r.User)
                 .WithMany()
                 .HasForeignKey(r => r.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
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
