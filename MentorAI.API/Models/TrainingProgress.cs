namespace MentorAI.API.Models;

public class TrainingProgress
{
	public int TotalAnswers { get; set; }

	public int CompletedTasks { get; set; }

	public double AverageScore { get; set; }
}