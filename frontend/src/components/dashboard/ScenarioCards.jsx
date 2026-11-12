import {
    GraduationCap,
    BriefcaseBusiness,
    Users,
    Dumbbell
} from "lucide-react";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getTrainingScenarios } from "../../api/api";

import "./ScenarioCards.css"

const categoryIcons = {
    Admission: GraduationCap,
    FirstJob: BriefcaseBusiness,
    Adaptation: Users
};

function ScenarioCards() {

	const [scenarios, setScenarios] = useState(null);
	const [error, setError] = useState(false);

	useEffect(() => {
		async function loadScenarios() {
			try {
				const data = await getTrainingScenarios();
				setScenarios(data);
			} catch (err) {
				console.error("Ошибка загрузки сценариев:", err);
				setError(true);
			}
		}

		loadScenarios();
	}, []);

	return (
		<section className="scenario-cards">
			<h2>Выбери направление</h2>

			{error && (
				<p className="scenarios-empty">Не удалось загрузить сценарии.</p>
			)}

			{!error && scenarios && scenarios.length === 0 && (
				<p className="scenarios-empty">Сценарии пока не добавлены.</p>
			)}

			{!error && scenarios && scenarios.length > 0 && (
				<div className="scenarios-list">
					{scenarios.map((item) => {
						const Icon = categoryIcons[item.category] || Dumbbell;

						return (
							<div className="scenario-card" key={item.id}>
								<Icon size={28} />
								<h3>{item.title}</h3>
								<p>{item.description}</p>

								<Link to="/exercise">
									Начать подготовку →
								</Link>
							</div>
						)
					})}
				</div>
			)}
		</section>
	);
}

export default ScenarioCards;
