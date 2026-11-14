using MentorAI.API.Models;

using Microsoft.EntityFrameworkCore;

using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace MentorAI.API.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
	public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
		: base(options)
	{
		
	}
	public DbSet<ChatMessage> ChatMessages { get; 
	set; }

	public DbSet<ChatSession> ChatSessions { get; set; }

	public DbSet<TrainingScenario> TrainingScenarios { get; set; }

	public DbSet<TrainingTask> TrainingTasks { get; set; }

	public DbSet<TrainingAnswer> TrainingAnswers { get; set; }

	public DbSet<UserProfile> UserProfiles { get; set; }

	public DbSet<LearningProfile> LearningProfiles { get; set; }

	public DbSet<NotificationPreference> NotificationPreferences { get; set; }

	public DbSet<EmailConfirmationCode> EmailConfirmationCodes { get; set; }

	public DbSet<Announcement> Announcements { get; set; }

	public DbSet<AnnouncementRecipient> AnnouncementRecipients { get; set; }

	protected override void OnModelCreating(ModelBuilder builder)
	{
		base.OnModelCreating(builder);

		builder.Entity<Announcement>(entity =>
		{
			entity.Property(a => a.Title).HasMaxLength(200).IsRequired();
			entity.Property(a => a.Body).HasMaxLength(8000).IsRequired();

			// список анонсов в админке — по свежести
			entity.HasIndex(a => a.CreatedAt);

			// поиск «осиротевших» рассылок при восстановлении
			entity.HasIndex(a => a.Status);
		});

		builder.Entity<AnnouncementRecipient>(entity =>
		{
			entity.Property(r => r.Reason).HasMaxLength(300);

			// один результат на получателя в рамках анонса — фундамент идемпотентности
			entity.HasIndex(r => new { r.AnnouncementId, r.UserId }).IsUnique();

			// выбор Pending-получателей батчами и сметание зависших Processing
			entity.HasIndex(r => new { r.AnnouncementId, r.Status });

			// получатели удаляются вместе с анонсом
			entity.HasOne(r => r.Announcement)
				.WithMany()
				.HasForeignKey(r => r.AnnouncementId)
				.OnDelete(DeleteBehavior.Cascade);

			// пользователь не должен удаляться каскадом со стороны анонса;
			// идентификатор обнуляется, если пользователь удалён
			entity.HasOne<ApplicationUser>()
				.WithMany()
				.HasForeignKey(r => r.UserId)
				.OnDelete(DeleteBehavior.SetNull);
		});
	}
}