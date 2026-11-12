import {
    BookOpen,
    Target,
    Clock,
    Brain
} from "lucide-react";

import { useEffect, useState } from "react";

import { getTrainingProgress, getTrainingSkills } from "../../api/api";

import "./Statistics.css"

function Statistics() {

	const [progress, setProgress] = useState(null);
	const [skills, setSkills] = useState(null);
	const [error, setError] = useState(false);

	useEffect(() => {
		async function loadStatistics() {
			try {
				const [progressData, skillsData] = await Promise.all([
					getTrainingProgress(),
					getTrainingSkills()
				]);

				setProgress(progressData);
				setSkills(skillsData);
			} catch (err) {
				console.error("Ошибка загрузки статистики:", err);
				setError(true);
			}
		}

		loadStatistics();
	}, []);

	const statistics = [
		{
			title: "Завершено заданий",
			value: progress ? String(progress.completedTasks) : "...",
			icon: BookOpen
		},
		{
			title: "Средний результат",
			value: progress ? `${Math.round(progress.averageScore)}%` : "...",
			icon: Target
		},
		{
			title: "Время обучения",
			value: "—",
			icon: Clock
		},
		{
			title: "Навыков оценено",
			value: skills ? String(skills.length) : "...",
			icon: Brain
		}
	];

	return (
		<section className="statistics">
			<h2>Твоя статистика</h2>

			{error && (
				<p className="statistics-empty">Не удалось загрузить статистику. Попробуй обновить страницу.</p>
			)}

			{!error && (
				<div className="statistics-list">
					{statistics.map((item) => {
						const Icon = item.icon;

						return (
							<div className="statistics-card" key={item.title}>
								<Icon size={24}/>
								<h3>{item.value}</h3>
								<p>{item.title}</p>
							</div>
						)
					})}
				</div>
			)}
		</section>
	);
}

export default Statistics;
