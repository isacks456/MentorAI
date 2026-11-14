import { RECIPIENT_STATS } from "./statusMeta";
import "./AnnouncementStats.css";

// Разбивка статистики рассылки по получателям.
// Показывает только агрегированные числа — без email-ов и персональных данных.
function AnnouncementStats({ stats }) {
    if (!stats) return null;

    const total = stats.total ?? 0;

    return (
        <div className="announcement-stats">
            <div className="announcement-stats-total">
                <span className="announcement-stats-total-value">{total}</span>
                <span className="announcement-stats-total-label">получателей всего</span>
            </div>

            <div className="announcement-stats-grid">
                {RECIPIENT_STATS.map((item) => {
                    const value = stats[item.key] ?? 0;
                    const percent = total > 0 ? Math.round((value / total) * 100) : 0;

                    return (
                        <div className={`announcement-stat tone-${item.tone}`} key={item.key} title={item.hint}>
                            <span className="announcement-stat-value">{value}</span>
                            <span className="announcement-stat-label">{item.label}</span>
                            {total > 0 && (
                                <span className="announcement-stat-percent">{percent}%</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default AnnouncementStats;
