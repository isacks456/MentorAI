import "./ProgressChart.css";
import { useEffect, useState } from "react";
import { getTrainingResults } from "../../api/api";

function ProgressChart() {
	const [results, setResults] = useState([]);

	useEffect(() => {
		async function loadResults() {
			try {
				const data = await getTrainingResults();
				setResults(data);
			} catch (error) {
				console.error(error.message);
			}
		}

		loadResults();
	}, []);

	return (
		<section className="progress-chart">
			<div className="chart-heading">
				<h3>Динамика обучения</h3>
				<p>Изменение результатов по тренировкам</p>
			</div>

				<div className="chart-content">
					{results.map((item,index) => {
						return (
							<div className="chart-item" key={index}>
								<div className="chart-bar-wrapper">
									<div className="chart-bar" style={{ height: `${item.score}%` }}></div>
								</div>

								<span className="chart-score">
									{item.score}%
								</span>

								<span className="chart-day">
									{item.day}
								</span>
							</div>
						);
					})}
				</div>
		</section>
	);
}

export default ProgressChart;