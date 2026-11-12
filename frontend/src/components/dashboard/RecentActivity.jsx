import "./RecentActivity.css"

function RecentActivity() {

    const activities = [
        {
            title: "Тренирока собеседования",
            date: "Сегодня",
            status: "Завершено"
        },
        {
            title: "Решение тренировочного кейса",
            date: "Вчера",
            status: "завершено"
        },
        {
            title: "Диалог с AI-наставником",
            date: "28.10.2026",
            status: "Завершено"
        }
    ];

    return (
        <section className="recent-activity">
            <h2>Последняя активность</h2>
            
            <div className="activity-list">
                {activities.map((item, index) => (
                    <div className="activity-item" key={index}>
                        <h3>{item.title}</h3>
                        <p>{item.date}</p>
                        <span>{item.status}</span>
                    </div>
                ))}
            </div>

        </section>
    );
}

export default RecentActivity;