import ProgressStats from "../components/progress/ProgressStats";
import ProgressChart from "../components/progress/ProgressChart";
import SkillsProgress from "../components/progress/SkillsProgress";
import Weaknesses from "../components/progress/Weaknesses";

import "./Progress.css";

function Progress() {
	return (
		<div className="progress-page">
			<div className="progress-heading">
				<h2>Мой прогресс</h2>
				<p>Отслеживай свои результаты и развитие навыков</p>
			</div>

			<ProgressStats/>

			<ProgressChart/>

			<div className="progress-bottom">
				<SkillsProgress/>
				<Weaknesses/>
			</div>

		</div>
	);
}

export default Progress;