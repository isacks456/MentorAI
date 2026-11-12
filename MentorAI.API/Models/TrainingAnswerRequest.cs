namespace MentorAI.API.Models;

public class TrainingAnswerRequest
{
    public int TrainingTaskId { get; set; }
    public string Answer { get; set; } = string.Empty;
}