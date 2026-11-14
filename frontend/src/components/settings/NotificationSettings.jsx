import { Bell, Mail, MessageSquare, Trophy, Newspaper } from "lucide-react";
import "./NotificationSettings.css";

import { useState, useEffect } from "react";

import {
    getNotificationPreferences,
    saveNotificationPreferences
} from "../../api/api";

// Замечание: здесь сохраняются только ПРЕДПОЧТЕНИЯ пользователя.
// Фактическая отправка уведомлений в MentorAI пока не реализована —
// переключатели управляют тем, какие уведомления пользователь хочет получать.
function NotificationSettings() {

    const [prefs, setPrefs] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [savedAt, setSavedAt] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const data = await getNotificationPreferences();

                if (!cancelled) setPrefs({
                    progress: data.progressNotifications,
                    reminders: data.lessonReminders,
                    news: data.newsUpdates,
                    email: data.emailNotifications
                });
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        load();

        return () => { cancelled = true; };
    }, []);

    const toggle = async (key) => {
        if (!prefs || isSaving) return;

        const next = { ...prefs, [key]: !prefs[key] };
        setPrefs(next);
        setIsSaving(true);
        setError("");

        try {
            const data = await saveNotificationPreferences({
                progressNotifications: next.progress,
                lessonReminders: next.reminders,
                newsUpdates: next.news,
                emailNotifications: next.email
            });

            setSavedAt(new Date());
            // синхронизируем с ответом сервера
            setPrefs({
                progress: data.progressNotifications,
                reminders: data.lessonReminders,
                news: data.newsUpdates,
                email: data.emailNotifications
            });
        } catch (err) {
            // откатываем к предыдущему состоянию при ошибке
            setPrefs(prefs);
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const items = [
        {
            key: "progress",
            title: "Уведомления о прогрессе обучения",
            description: "Сводки по результатам и росту навыков",
            icon: Trophy
        },
        {
            key: "reminders",
            title: "Напоминания о занятиях",
            description: "Напоминания о незавершённых заданиях",
            icon: MessageSquare
        },
        {
            key: "news",
            title: "Новости и обновления MentorAI",
            description: "Новые функции и материалы платформы",
            icon: Newspaper
        },
        {
            key: "email",
            title: "Уведомления по электронной почте",
            description: "Дублировать важные сообщения на почту",
            icon: Mail
        }
    ];

    return (
        <section className="notification-settings">
            <div className="notification-heading">
                <div>
                    <h3>Уведомления</h3>
                    <p>Настрой, какие уведомления ты хочешь получать</p>
                </div>

                <Bell size={22} />
            </div>

            {error && <p className="notification-error" role="alert">{error}</p>}

            <div className="notification-list">
                {items.map((item) => {
                    const Icon = item.icon;

                    return (
                        <div className="notification-item" key={item.key}>
                            <div className="notification-icon">
                                <Icon size={19} />
                            </div>

                            <div className="notification-info">
                                <h4>{item.title}</h4>
                                <p>{item.description}</p>
                            </div>

                            <button
                                type="button"
                                role="switch"
                                aria-checked={prefs ? prefs[item.key] : false}
                                aria-label={item.title}
                                className={`notification-switch ${prefs && prefs[item.key] ? "active" : ""}`}
                                disabled={isLoading || isSaving}
                                onClick={() => toggle(item.key)}
                            >
                                <span></span>
                            </button>
                        </div>
                    );
                })}
            </div>

            <p className="notification-status" aria-live="polite">
                {isLoading
                    ? "Загрузка настроек..."
                    : isSaving
                        ? "Сохранение..."
                        : savedAt
                            ? "Настройки сохранены"
                            : ""}
            </p>

            <p className="notification-note">
                Здесь сохраняются твои предпочтения. Фактическая отправка уведомлений будет добавлена позже.
            </p>
        </section>
    );
}

export default NotificationSettings;
