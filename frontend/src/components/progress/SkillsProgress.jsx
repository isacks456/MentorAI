import { useEffect, useState } from "react";
import { getTrainingSkills } from "../../api/api";
import "./SkillsProgress.css";

function SkillsProgress() {

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

    return (
        <section className="skills-progress">
            <h3>Развитие навыков</h3>
            <p className="skills-description">
                Твои результаты по основным направлениям
            </p>

            <div className="skills-list">
                {skills.map((skill, index) => {
                    return (
                        <div className="skill-item" key={index}>
                            <div className="skill-info">
                                <span>{skill.name}</span>
                                <span>{Math.round(skill.progress)}%</span>
                            </div>

                            <div className="skill-progress-bar">
                                <div
                                    className="skill-progress-fill"
                                    style={{
                                        width: `${skill.progress}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default SkillsProgress;