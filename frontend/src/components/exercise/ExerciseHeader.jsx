import { Target, Clock3, ChevronLeft, ChevronRight } from "lucide-react";
import "./ExerciseHeader.css";

function ExerciseHeader({
    currentIndex,
    totalTasks,
    canGoPrev,
    canGoNext,
    onPrevTask,
    onNextTask
}) {
	return (
		<section className="exercise-header">
			<div>
				<h2>Тренажёр</h2>
				<p>Проверь свои навыки на практических заданиях</p>
			</div>

			<div className="exercise-info">
				<div className="exercise-progress">
					<Target size={18}/>
					<span>
						{totalTasks > 0
							? `Задание ${currentIndex + 1} из ${totalTasks}`
							: "Нет заданий"}
					</span>
				</div>

				{totalTasks > 1 && (
					<div className="exercise-nav">
						<button
							type="button"
							aria-label="Предыдущее задание"
							onClick={onPrevTask}
							disabled={!canGoPrev}
						>
							<ChevronLeft size={18}/>
						</button>

						<button
							type="button"
							aria-label="Следующее задание"
							onClick={onNextTask}
							disabled={!canGoNext}
						>
							<ChevronRight size={18}/>
						</button>
					</div>
				)}

				<div className="exercise-time">
					<Clock3 size={18}/>
					<span>Без ограничения времени</span>
				</div>
			</div>
		</section>
	);
}

export default ExerciseHeader;
