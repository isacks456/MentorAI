
import "./Recommendation.css"

function Recommendations() {
	
	const recommendations = [
		{
			title: "Развивай коммуникацию",
			description: "Попробуй объяснять свои технические решения более подробно."
		},
		{
			title: "Практикуй решение проблем",
            description: "Пройди несколько тренировочных кейсов для развития аналитического мышления."
		},
		{
			title: "Подготовь самопрезентацию",
            description: "Научись кратко рассказывать о своих навыках и проектах."
		}
	];

	return (
		<section className="recommendations">
			<h2>Рекомендации AI-наставника</h2>

			<div className="recommendations-list">
				{recommendations.map((item,index) => (
					<div className="recommendation-item" key={index}>
						<h3>{item.title}</h3>
						<p>{item.description}</p>
					</div>
				))}
			</div>
		</section>
	);
}

export default Recommendations;