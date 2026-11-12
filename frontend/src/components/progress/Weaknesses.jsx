import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Lightbulb } from "lucide-react";
import { getTrainingSkills } from "../../api/api";

import "./Weaknesses.css";

function Weaknesses() {

    const [skills, setSkills] = useState([]);

    useEffect(() => {
        async function loadSkills() {
            try {
                const data = await getTrainingSkills();
                setSkills(data);
            } catch (error) {
                console.error(error.message);
            }
        }

        loadSkills();
    }, []);

    const weaknesses = skills.filter(skill => skill.progress < 60);

    const strengths = skills.filter(skill => skill.progress >= 80);

    const developingSkills = skills.filter(
         skill => skill.progress >= 60 && skill.progress < 80
        );

    const weakestSkill = skills.length > 0
    ? [...skills].sort((a, b) => a.progress - b.progress)[0]
    : null;

    return (
        <section className="weaknesses">
            <h3>Слабые места и рекомендации</h3>

            <div className="weakness-list">
                {weaknesses.length === 0 && (
                    <p>Пока нет навыков с результатом ниже 60%.</p>
                )}
                {weaknesses.map((item, index) => (
                    <div className="weakness-item" key={index}>
                        <AlertCircle size={19} />

                        <div>
                            <h4>{item.name}</h4>
                            <p>
                                Твой результат — {Math.round(item.progress)}%.
                            </p>
                            <p>{item.recommendation}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="developing-list">
                    <h4>Требует развития</h4>

                    {developingSkills.length === 0 && (
                        <p>Пока нет навыков в этой категории.</p>
                    )}

                    {developingSkills.map((item, index) => (
                        <div className="developing-item" key={index}>
                            <div>
                                <h4>{item.name}</h4>
                                <p>Твой результат — {Math.round(item.progress)}%.</p>
                                <p>{item.recommendation}</p>
                            </div>
                        </div>
                    ))}
                </div>

            <div className="strengths-list">
                {strengths.length === 0 && (
                    <p>Пока нет навыков с результатом 80% и выше.</p>
                )}
               {strengths.map((item, index) => (
                    <div className="strength-item" key={index}>
                        <CheckCircle size={19} />

                        <div>
                            <h4>{item.name}</h4>
                            <p>
                                Твой результат — {Math.round(item.progress)}%.
                            </p>
                            <p>{item.recommendation}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="recommendation">
                <Lightbulb size={19} />
                <p>
                    {weakestSkill
                        ? `Рекомендуем уделить больше внимания навыку "${weakestSkill.name}". Твой текущий результат — ${Math.round(weakestSkill.progress)}%.`
                        : "Выполни несколько тренировочных заданий, чтобы получить персональные рекомендации."
                    }
                </p>
            </div>
        </section>
    );
}

export default Weaknesses;