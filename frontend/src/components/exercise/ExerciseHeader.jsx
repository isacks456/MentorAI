import { Target, Clock3 } from "lucide-react";
import "./ExerciseHeader.css";

function ExerciseHeader() {
	return (
		<section className="exercise-header">
			<div>
				<h2>Тренажёр</h2>
				<p>Проверь свои навыки на практических заданиях</p>
			</div>

			<div className="exercise-info">
				<div className="exercise-progress">
					<Target size={18}/>
					<span>Задание 1 из 5</span>
				</div>

				<div className="exercise-time">
					<Clock3 size={18}/>
					<span>Без ограничения времени</span>
				</div>
			</div>
		</section>
	);
}

export default ExerciseHeader;