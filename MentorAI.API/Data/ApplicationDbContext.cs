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
}