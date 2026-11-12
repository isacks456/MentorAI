namespace MentorAI.API.Models;

public class TrainingScenario
{
	public int Id {get; set;}

	public string Title { get; set; } = string.Empty;

	public string Description { get; set; } = string.Empty;

	public string Category { get; set; } = string.Empty;

	public string Difficulty  { get; set; } = string.Empty;
}