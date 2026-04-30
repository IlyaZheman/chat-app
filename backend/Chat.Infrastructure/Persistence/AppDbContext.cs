using System.Text.Json;
using Chat.Domain.Enums;
using Chat.Domain.Models;
using Chat.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace Chat.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    public DbSet<UserEntity> Users { get; set; }
    public DbSet<ChatEntity> Chats { get; set; }
    public DbSet<MessageEntity> Messages { get; set; }
    public DbSet<ChatMemberEntity> ChatMembers { get; set; }
    public DbSet<RoleEntity> Roles { get; set; }

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
            b.Property(c => c.PrivateKey);
            b.HasIndex(c => c.PrivateKey)
                .IsUnique()
                .HasFilter("\"PrivateKey\" IS NOT NULL");
        });

        modelBuilder.Entity<RoleEntity>(b =>
        {
            b.HasKey(r => r.Id);
            b.Property(r => r.Name).IsRequired();
            b.Property(r => r.Permissions)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonOpts),
                    v => JsonSerializer.Deserialize<ChatPermissions>(v, JsonOpts)!);
            b.HasOne(r => r.Chat)
                .WithMany(c => c.Roles)
                .HasForeignKey(r => r.ChatId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MessageEntity>(b =>
        {
            b.HasKey(m => m.Id);
            b.Property(m => m.Payload).HasColumnType("json").IsRequired();
            b.Property(m => m.SentAt).IsRequired();
            b.Property(m => m.EditedAt);
            b.Property(m => m.DeletedAt);

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

            b.HasOne(cm => cm.Chat)
                .WithMany(c => c.Members)
                .HasForeignKey(cm => cm.ChatId);

            b.HasOne(cm => cm.User)
                .WithMany()
                .HasForeignKey(cm => cm.UserId);

            b.HasOne(cm => cm.Role)
                .WithMany(r => r.Members)
                .HasForeignKey(cm => cm.RoleId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }
}
