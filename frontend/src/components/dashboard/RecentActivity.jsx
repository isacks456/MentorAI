import { useEffect, useState } from "react";

import { getRecentActivity } from "../../api/api";

import "./RecentActivity.css"

function formatActivityDate(isoDate) {
    const date = new Date(isoDate);
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (date >= startOfToday) {
        return "Сегодня";
    }

    if (date >= startOfYesterday) {
        return "Вчера";
    }

    return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function RecentActivity() {
    const [activities, setActivities] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function loadActivities() {
            try {
                const data = await getRecentActivity();
                setActivities(data);
            } catch (err) {
                console.error("Ошибка загрузки активности:", err);
                setError(true);
            }
        }

        loadActivities();
    }, []);

    return (
        <section className="recent-activity">
            <h2>Последняя активность</h2>

            {error && (
                <p className="activity-empty">Не удалось загрузить активность.</p>
            )}

            {!error && activities && activities.length === 0 && (
                <p className="activity-empty">
                    Пока нет активности. Начни тренировку или диалог с AI-наставником.
                </p>
            )}

            {activities && activities.length > 0 && (
                <div className="activity-list">
                    {activities.map((item, index) => (
                        <div className="activity-item" key={index}>
                            <h3>{item.title}</h3>
                            <p>{formatActivityDate(item.date)}</p>
                            <span>{item.status}</span>
                        </div>
                    ))}
                </div>
            )}

        </section>
    );
}

export default RecentActivity;
