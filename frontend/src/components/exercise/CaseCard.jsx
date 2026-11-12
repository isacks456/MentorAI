import { Briefcase, Lightbulb } from "lucide-react";

import "./CaseCard.css";

function CaseCard({ scenario, task }) {
	if (!scenario) {
    return (
        <section className="case-card">
            <h2>Выбери направление</h2>
            <p>Чтобы начать тренировку, выбери один из сценариев выше.</p>
        </section>
		);
	}
	return (
		<section className="case-card">
			<div className="case-top">
				<div className="case-category">
					<Briefcase size={18}/>
					<span>{scenario.title}</span>
				</div>
				<span className="case-difficulty">
					{scenario.difficulty}
				</span>
			</div>

				{/* <h2>Ситуация: первое техническое собеседование</h2> */}

				<p className="case-description">
					{scenario.description}
				</p>

				{task && (
				<div className="case-question">
					<h3>{task.title}</h3>
					<p>{task.description}</p>
					<p>{task.question}</p>
				</div>
			)}

				{/* <div className="case-talk">
					<h3>Твоя задача</h3>
					<p>
					Расскажи, что такое замыкание (Closure) в JavaScript.
                    Объясни принцип его работы и приведи простой пример
                    использования в реальной разработке.
					</p>
				</div> */}

				<div className="case-hint">
					<Lightbulb size={19}/>
					<p>
						Постарайся объяснить тему своими словами.
                    	Представь, что отвечаешь настоящему интервьюеру.
					</p>
				</div>
		</section>
	);
}

export default CaseCard;