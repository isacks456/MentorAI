import { useEffect, useState } from "react";

import { getTrainingSkills } from "../../api/api";

import "./Recommendation.css"

function Recommendations() {

	const [skills, setSkills] = useState(null);
	const [error, setError] = useState(false);

	useEffect(() => {
		async function loadSkills() {
			try {
				const data = await getTrainingSkills();
				setSkills(data);
			} catch (err) {
				console.error("Ошибка загрузки навыков:", err);
				setError(true);
			}
		}

		loadSkills();
	}, []);

	const weakSkills = skills
		? skills.filter(skill => skill.progress < 80)
		: [];

	return (
		<section className="recommendations">
			<h2>Рекомендации AI-наставника</h2>

			{error && (
				<p className="recommendations-empty">Не удалось загрузить рекомендации.</p>
			)}

			{!error && skills && skills.length === 0 && (
				<p className="recommendations-empty">
					Пройди первое задание в тренажёре, чтобы получить персональные рекомендации.
				</p>
			)}

			{!error && skills && skills.length > 0 && weakSkills.length === 0 && (
				<p className="recommendations-empty">
					Отличный прогресс! Все оценённые навыки выше 80%. Продолжай тренироваться, чтобы сохранить результат.
				</p>
			)}

			{!error && weakSkills.length > 0 && (
				<div className="recommendations-list">
					{weakSkills.map((item, index) => (
						<div className="recommendation-item" key={index}>
							<h3>{item.name} — {Math.round(item.progress)}%</h3>
							<p>{item.recommendation}</p>
						</div>
					))}
				</div>
			)}
		</section>
	);
}

export default Recommendations;
