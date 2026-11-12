import { Target, TrendingUp, Clock, Flame } from "lucide-react";

import "./ProgressStats.css";

import { useEffect, useState } from "react";
import { getTrainingProgress } from "../../api/api";

function ProgressStats()  {

	const [progress, setProgress] = useState(null);
	const [error, setError] = useState(false);

	useEffect(() => {
    async function loadProgress() {
        try {
            const data = await getTrainingProgress();
            setProgress(data);
        } catch (err) {
            console.error(err.message);
            setError(true);
        }
    }

    loadProgress();
}, []);

	const statistics = [
	{
    title: "Завершено тренировок",
    value: progress ? progress.completedTasks : (error ? "—" : "..."),
    icon: Target
	},
	{
		title: "Средний результат",
		value: progress ? `${progress.averageScore}%` : (error ? "—" : "..."),
		icon: TrendingUp
	},
		{
			// достоверных данных о времени обучения пока нет (не трекается)
			title: "Время обучения",
			value: "Нет данных",
			icon: Clock
		},
		{
			// серия дней не считается искусственно — покажем её только когда появятся реальные данные
			title: "Текущая серия",
			value: "Нет данных",
			icon: Flame
		}
	];

	return (
		<section className="progress-stats">
			{statistics.map((item, index) => {
				const Icon = item.icon;

				return (
					<div className="progress-stat-card" key={index}>
						<div className="stat-icon">
							<Icon size={22}/>
						</div>

						<div className="stat-info">
							<h3>{item.value}</h3>
							<p>{item.title}</p>
						</div>
					</div>
				);
			})}
		</section>
	)
}

export default ProgressStats;