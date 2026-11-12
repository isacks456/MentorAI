import ExerciseHeader from "../components/exercise/ExerciseHeader";
import ScenarioSelector from "../components/exercise/ScenarioSelector";
import CaseCard from "../components/exercise/CaseCard";
import AnswerForm from "../components/exercise/AnswerForm";

import { useEffect, useState } from "react";
import { getTrainingScenarios, getScenarioTasks } from "../api/api";

import "./Exercise.css";

function Exercise() {
	const [scenarios, setScenarios] = useState([]);
	const [selectedScenario, setSelectedScenario] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [tasks, setTasks] = useState(null);

	const [taskIndex, setTaskIndex] = useState(0);

	useEffect(() => {
		async function loadScenarios() {
			try {
				const data = await getTrainingScenarios();
				setScenarios(data);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		}

		loadScenarios();
	}, []);

	useEffect(() => {
		async function loadTasks() {
			if (!selectedScenario) {
				setTasks(null);
				return;
			}

			try {
				const data = await getScenarioTasks(selectedScenario.id);
				setTasks(data);
			} catch (err) {
				console.error(err.message);
				setTasks([]);
			}
		}

		loadTasks();
	}, [selectedScenario]);

	const handleSelectScenario = (scenario) => {
		setSelectedScenario(scenario);
		// при смене сценария возвращаемся к первому заданию
		setTaskIndex(0);
	};

	const currentTask = tasks && tasks.length > 0 ? tasks[taskIndex] : null;
	const totalTasks = tasks ? tasks.length : 0;

	const canGoPrev = taskIndex > 0;
	const canGoNext = tasks ? taskIndex < tasks.length - 1 : false;

	const handlePrevTask = () => {
		if (canGoPrev) {
			setTaskIndex(taskIndex - 1);
		}
	};

	const handleNextTask = () => {
		if (canGoNext) {
			setTaskIndex(taskIndex + 1);
		}
	};

	return (
	<div className="exercise-page">
		<ExerciseHeader
			currentIndex={taskIndex}
			totalTasks={totalTasks}
			canGoPrev={canGoPrev}
			canGoNext={canGoNext}
			onPrevTask={handlePrevTask}
			onNextTask={handleNextTask}
		/>

        {loading && <p>Загрузка сценариев...</p>}
        {error && <p>{error}</p>}

        {!loading && !error && (
            <>
                <ScenarioSelector
				scenarios={scenarios}
				selectedScenario={selectedScenario}
				onSelectScenario={handleSelectScenario}
				/>

				{selectedScenario && tasks && tasks.length === 0 && (
					<section className="case-card">
						<h2>{selectedScenario.title}</h2>
						<p>В этом направлении пока нет заданий. Попробуй выбрать другой сценарий.</p>
					</section>
				)}

                <CaseCard
                scenario={selectedScenario}
                task={currentTask}
                />
                {currentTask && (
                    <AnswerForm key={currentTask.id} task={currentTask} />
                    )}
            </>
        )}
    </div>
	);
}

export default Exercise;
