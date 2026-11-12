namespace MentorAI.API.Models;

public class TrainingTask
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Question { get; set; } = string.Empty;

    public string Skill { get; set; } = string.Empty;

    public int TrainingScenarioId { get; set; }

    public TrainingScenario? TrainingScenario { get; set; }
}