import { Trophy, MessageSquare, Target, Flame } from "lucide-react";
import "./ProfileProgress.css";

function ProfileProgress() {
    const statistics = [
        {
            title: "Завершено заданий",
            value: "12",
            description: "Практических кейсов",
            icon: Trophy
        },
        {
            title: "Диалогов с AI",
            value: "8",
            description: "Проведённых бесед",
            icon: MessageSquare
        },
        {
            title: "Освоено навыков",
            value: "6",
            description: "Изученных направлений",
            icon: Target
        },
        {
            title: "Дней активности",
            value: "7",
            description: "Время обучения",
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
