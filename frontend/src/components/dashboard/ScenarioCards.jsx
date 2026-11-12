import {
    GraduationCap,
    BriefcaseBusiness,
    Users
} from "lucide-react";

import "./ScenarioCards.css"

function ScenarioCards() {

	const scenarios = [
		{
			title: "Поступление",
			description: "Подготовка к поступлению и выбор образовательной программы.",
			icon: GraduationCap,
			path: "/mentor"
		},
		{
			title: "Первая работа",
			description: "Подготовка резюме, собеседования и поиск стажировки.",
			icon: BriefcaseBusiness,
			path: "/mentor"
		},
		{
			title: "Адаптация",
			description: "Коммуникация, командная работа и рабочие ситуации.",
			icon: Users,
			path: "/mentor"
		}
	];

	return (
		<section className="scenario-cards">
			<h2>Выбери направление</h2>

			<div className="scenarios-list">
				{scenarios.map((item) => {
					const Icon = item.icon;

					return (
						<div className="scenario-card" key={item.title}>
							<Icon size={28} />
							<h3>{item.title}</h3>
							<p>{item.description}</p>
							
							<a href={item.path}>
								Начать подготовку →
							</a>
						</div>
					)
				})}
			</div>
		</section>
	);
}

export default ScenarioCards;