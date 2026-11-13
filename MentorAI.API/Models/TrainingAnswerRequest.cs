using System.ComponentModel.DataAnnotations;

namespace MentorAI.API.Models;

public class TrainingAnswerRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "Некорректный идентификатор задания")]
    public int TrainingTaskId { get; set; }

    [Required(ErrorMessage = "Ответ не может быть пустым")]
    [MaxLength(4000, ErrorMessage = "Ответ не может быть длиннее 4000 символов")]
    public string Answer { get; set; } = string.Empty;
}
