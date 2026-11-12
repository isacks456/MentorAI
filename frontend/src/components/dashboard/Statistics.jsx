import {
    BookOpen,
    Target,
    Clock,
    Brain
} from "lucide-react";

import "./Statistics.css"

function Statistics() {

	const statistics = [
		{
			title: "Занятие пройдено",
			value: 12,
			icon: BookOpen
		},
		{
			title: "Успешность",
			value: "78%",
			icon: Target
		},
		{
			title: "Время обучения",
			value: "8 ч",
			icon: Clock
		},
		{
			title: "Навыков оценено",
			value: 5,
			icon: Brain
		}
	];

	return (
		<section className="statistics">
			<h2>Твоя статистика</h2>

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
		</section>
	);
}

export default Statistics;