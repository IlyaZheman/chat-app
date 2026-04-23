using Chat.Domain.Enums;
using Chat.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace Chat.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<UserEntity> Users { get; set; }
    public DbSet<ChatEntity> Chats { get; set; }
    public DbSet<MessageEntity> Messages { get; set; }
    public DbSet<ChatMemberEntity> ChatMembers { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserEntity>(b =>
        {
            b.HasKey(u => u.Id);
            b.Property(u => u.Email).IsRequired();
            b.Property(u => u.UserName).IsRequired();
            b.Property(u => u.PasswordHash).IsRequired();
            b.Property(u => u.Role).IsRequired().HasDefaultValue(UserRole.User);
        });

        modelBuilder.Entity<ChatEntity>(b =>
        {
            b.HasKey(c => c.Id);
            b.Property(c => c.Type).IsRequired();
            b.Property(c => c.CreatedAt).IsRequired();
        });

        modelBuilder.Entity<MessageEntity>(b =>
        {
            b.HasKey(m => m.Id);
            b.Property(m => m.Text).IsRequired();
            b.Property(m => m.SentAt).IsRequired();

            b.HasOne(m => m.Chat)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ChatId);

            b.HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId);
        });

        modelBuilder.Entity<ChatMemberEntity>(b =>
        {
            b.HasKey(cm => new { cm.ChatId, cm.UserId });
            b.Property(cm => cm.Role).IsRequired().HasDefaultValue(ChatMemberRole.Member);

            b.HasOne(cm => cm.Chat)
                .WithMany(c => c.Members)
                .HasForeignKey(cm => cm.ChatId);

            b.HasOne(cm => cm.User)
                .WithMany()
                .HasForeignKey(cm => cm.UserId);
        });
    }
}