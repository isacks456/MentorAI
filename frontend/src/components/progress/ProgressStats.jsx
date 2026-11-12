import { Target, TrendingUp, Clock, Flame } from "lucide-react";

import "./ProgressStats.css";

import { useEffect, useState } from "react";
import { getTrainingProgress } from "../../api/api";

function ProgressStats()  {

	const [progress, setProgress] = useState(null);

	useEffect(() => {
    async function loadProgress() {
        try {
            const data = await getTrainingProgress();
            setProgress(data);
        } catch (error) {
            console.error(error.message);
        }
    }

    loadProgress();
}, []);

	const statistics = [
	{
    title: "Завершено тренировок",
    value: progress ? progress.completedTasks : "...",
    icon: Target
	},
	{
		title: "Средний результат",
		value: progress ? `${progress.averageScore}%` : "...",
		icon: TrendingUp
	},
		{
			title: "Время обучения",
			value: "8 ч",
			icon: Clock
		},
		{
			title: "Текущая серия",
			value: "5 дней",
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