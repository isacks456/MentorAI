import { Trophy, MessageSquare, Target, Flame } from "lucide-react";
import "./ProfileProgress.css";

import { useEffect, useState } from "react";
import { getTrainingSummary } from "../../api/api";

function ProfileProgress() {
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function loadSummary() {
            try {
                const data = await getTrainingSummary();
                setSummary(data);
            } catch (err) {
                console.error(err.message);
                setError(true);
            }
        }

        loadSummary();
    }, []);

    const statistics = [
        {
            title: "Завершено заданий",
            value: summary ? summary.completedTasks : (error ? "—" : "..."),
            description: "Практических кейсов",
            icon: Trophy
        },
        {
            title: "Диалогов с AI",
            value: summary ? summary.chatSessionsCount : (error ? "—" : "..."),
            description: "Проведённых бесед",
            icon: MessageSquare
        },
        {
            title: "Освоено навыков",
            value: summary ? summary.skillsCount : (error ? "—" : "..."),
            description: "Изученных направлений",
            icon: Target
        },
        {
            title: "Дней активности",
            value: summary ? summary.activeDays : (error ? "—" : "..."),
            description: "С ответами или диалогами",
            icon: Flame
        }
    ];

    return (
        <section className="profile-progress">
            <div className="profile-progress-heading">
                <h3>Моя активность</h3>
                <p>Твои результаты и достижения в MentorAI</p>
            </div>

            <div className="profile-statistics">
                {statistics.map((item, index) => {
                    const Icon = item.icon;

                    return (
                        <div className="profile-stat-card" key={index}>
                            <div className="profile-stat-top">
                                <span>{item.title}</span>
                                <Icon size={20} />
                            </div>

                            <h2>{item.value}</h2>

                            <p>{item.description}</p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default ProfileProgress;
