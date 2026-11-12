import { GraduationCap, Briefcase, Users } from "lucide-react";

import "./ScenarioSelector.css";

function ScenarioSelector({
    scenarios,
    selectedScenario,
    onSelectScenario
}) {

    const icons = {
        Admission: GraduationCap,
        FirstJob: Briefcase,
        Adaptation: Users
    };

    return (
        <section className="scenario-selector">
            <h3>Выбери направление</h3>

            <div className="scenario-options">
                {scenarios.map((item, index) => {
                    const Icon = icons[item.category];

                    return (
                        <button
						className={`scenario-option ${
							selectedScenario?.id === item.id ? "active" : ""
						}`}
						key={item.id}
						type="button"
						onClick={() => onSelectScenario(item)}
						>
                            {Icon && <Icon size={20} />}
                            <span>{item.title}</span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

export default ScenarioSelector;