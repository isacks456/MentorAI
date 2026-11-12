import { Send } from "lucide-react";
import { useState,  useEffect } from "react";
import {
    submitTrainingAnswer,
    getTrainingAnswers
} from "../../api/api";

import "./AnswerForm.css";

function AnswerForm({ task }) {
	const [answer, setAnswer] = useState("");
	const [result, setResult] = useState("");
	const [feedback, setFeedback] = useState(null);
	const [answers, setAnswers] = useState([]);

	useEffect(() => {
    async function loadAnswers() {
        if (!task) return;

        try {
            const data = await getTrainingAnswers(task.id);
            setAnswers(data);
        } catch (error) {
            console.error(error.message);
        }
    }

    loadAnswers();
}, [task]);

	async function handleSubmit() {
    if (!answer.trim()) {
        alert("Сначала напиши ответ!");
        return;
    }

	if (!task) {
    setResult("Задание ещё не загружено");
    return;
}

    try {
        const data = await submitTrainingAnswer(task.id, answer);

        setResult(data.message);
		setFeedback(data.feedback);
		const history = await getTrainingAnswers(task.id);
		setAnswers(history);
		setAnswer("");
        console.log("Ответ сервера:", data);
    } catch (error) {
        console.error(error);
        setResult("Не удалось отправить ответ");
    }
}
	return (
		<section className="answer-form">
			<div className="answer-heading">
				<h3>Твой ответ</h3>
				<p>Напиши ответ на предложенный кейс</p>
			</div>

			<textarea
			placeholder="Начни писать свой ответ..."
			rows={6}
			value={answer}
			onChange={(event) => setAnswer(event.target.value)}
			/>

			<div className="answer-footer">
				<span>Постарайся дать развёрнутый ответ</span>

				<button type="button" onClick={handleSubmit}>
					<Send size={17}/>
					Отправить ответ
				</button>
			</div>
			{result && (
				 <p className="answer-result">{result}</p>
				 )}

				 {feedback && (
					<div className="training-feedback">
						<h3>Результат проверки</h3>

						<p>Оценка: {feedback.score}/100</p>

						<p>{feedback.feedback}</p>

						{feedback.mistakes.length > 0 && (
							<div>
								<h4>Ошибки</h4>
								<ul>
									{feedback.mistakes.map((mistake, index) => (
										<li key={index}>{mistake}</li>
									))}
								</ul>
							</div>
						)}

						{feedback.recommendations.length > 0 && (
							<div>
								<h4>Рекомендации</h4>
								<ul>
									{feedback.recommendations.map((recommendation, index) => (
										<li key={index}>{recommendation}</li>
									))}
								</ul>
							</div>
						)}
					</div>
)}

				 {answers.length > 0 && (
					<div className="answer-history">
					<h3>История ответов</h3>

					{answers.map((item) => (
					<div className="answer-history-item" key={item.id}>
						<p>{item.answer}</p>
						<small>
							{new Date(item.createdAt).toLocaleString("ru-RU")}
						</small>
					</div>
				))}
			</div>
)}
		</section>
	);
}

export default AnswerForm;