namespace MentorAI.API.Models;

public class TrainingFeedback
{
	public int Score { get; set; }

	public string Feedback { get; set; }= string.Empty;

	public List<string> Mistakes { get; set; } = new();

	public List<string> Recommendations { get; set; } = new();
}