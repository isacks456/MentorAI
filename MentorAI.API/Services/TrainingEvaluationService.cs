using MentorAI.API.Models;

namespace MentorAI.API.Services;

public class TrainingEvaluationService
{
    public TrainingFeedback Evaluate(string answer)
    {
        var feedback = new TrainingFeedback();

        if (string.IsNullOrWhiteSpace(answer))
        {
            feedback.Score = 0;
            feedback.Feedback = "Ты не написал ответ.";

            feedback.Mistakes.Add("Ответ отсутствует.");
            feedback.Recommendations.Add("Попробуй ответить на вопрос.");

            return feedback;
        }

        if (answer.Length < 30)
        {
            feedback.Score = 30;
            feedback.Feedback = "Ответ слишком короткий.";

            feedback.Mistakes.Add("Недостаточно подробное объяснение.");
            feedback.Recommendations.Add("Раскрой свою мысль подробнее и добавь пример.");

            return feedback;
        }

        feedback.Score = 70;
        feedback.Feedback = "Ответ содержит достаточно текста, но требует дополнительной проверки.";
        feedback.Recommendations.Add("Добавь конкретный пример и объясни принцип работы.");

        return feedback;
    }
}