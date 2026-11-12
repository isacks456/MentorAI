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
    const [tasks, setTasks] = useState([]);

	useEffect(() => {
    async function loadScenarios() {
        try {
            const data = await getTrainingScenarios();
            setScenarios(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    loadScenarios();
	}, []);

    useEffect(() => {
    async function loadTasks() {
        if (!selectedScenario) {
            setTasks([]);
            return;
        }

        try {
            const data = await getScenarioTasks(selectedScenario.id);
            setTasks(data);
        } catch (error) {
            console.error(error.message);
        }
    }

        loadTasks();
    }, [selectedScenario]);

	return (
	<div className="exercise-page">
		<ExerciseHeader/>

        {loading && <p>Загрузка сценариев...</p>}
        {error && <p>{error}</p>}

        {!loading && !error && (
            <>
                <ScenarioSelector
				scenarios={scenarios}
				selectedScenario={selectedScenario}
				onSelectScenario={setSelectedScenario}
				/>
                <CaseCard
                scenario={selectedScenario}
                task={tasks[0]}
                />
                {tasks.length > 0 && (
                    <AnswerForm task={tasks[0]} />
                    )}
            </>
        )}
    </div>
	);
}

export default Exercise;