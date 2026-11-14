import { Bell, Mail, MessageSquare, Trophy, Newspaper, ShieldCheck, ShieldAlert, ArrowRight } from "lucide-react";
import "./NotificationSettings.css";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
    getNotificationPreferences,
    saveNotificationPreferences,
    getEmailStatus,
    sendEmailCode
} from "../../api/api";

// Замечание: переключатели управляют ПРЕДПОЧТЕНИЯМИ пользователя.
// Фактическая доставка уведомлений в MentorAI пока не реализована —
// есть серверный шлюз (NotificationService), который блокирует отправку
// при неподтверждённой почте или выключенном типе уведомлений.
function NotificationSettings() {

    const navigate = useNavigate();

    const [prefs, setPrefs] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [savedAt, setSavedAt] = useState(null);

    // статус почты
    const [emailConfirmed, setEmailConfirmed] = useState(null);
    const [isRequestingCode, setIsRequestingCode] = useState(false);
    const [codeError, setCodeError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const [prefData, emailStatus] = await Promise.all([
                    getNotificationPreferences(),
                    getEmailStatus().catch(() => null)
                ]);

                if (cancelled) return;

                setPrefs({
                    progress: prefData.progressNotifications,
                    reminders: prefData.lessonReminders,
                    news: prefData.newsUpdates,
                    email: prefData.emailNotifications
                });

                if (emailStatus) {
                    setEmailConfirmed(emailStatus.emailConfirmed);
                }
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
        // email-уведомления недоступны до подтверждения почты
        if (key === "email" && emailConfirmed === false) return;

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
            setPrefs({
                progress: data.progressNotifications,
                reminders: data.lessonReminders,
                news: data.newsUpdates,
                email: data.emailNotifications
            });
        } catch (err) {
            setPrefs(prefs);
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRequestCode = async () => {
        setCodeError("");
        setIsRequestingCode(true);

        try {
            const result = await sendEmailCode();

            if (result.smtpNotConfigured) {
                setCodeError(result.message);
                return;
            }

            navigate("/verify-email");
        } catch (err) {
            setCodeError(err.message);
        } finally {
            setIsRequestingCode(false);
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

    const emailLocked = emailConfirmed === false;

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

            {/* Статус подтверждения почты */}
            {!isLoading && emailConfirmed !== null && (
                <div className={`email-status ${emailConfirmed ? "confirmed" : "unconfirmed"}`}>
                    <div className="email-status-icon">
                        {emailConfirmed ? <ShieldCheck size={19} /> : <ShieldAlert size={19} />}
                    </div>

                    <div className="email-status-info">
                        <h4>{emailConfirmed ? "Почта подтверждена" : "Почта не подтверждена"}</h4>
                        <p>
                            {emailConfirmed
                                ? "Почтовые уведомления доступны"
                                : "Почтовые уведомления появятся после подтверждения адреса"}
                        </p>
                    </div>

                    {!emailConfirmed && (
                        <button
                            type="button"
                            className="email-status-action"
                            onClick={handleRequestCode}
                            disabled={isRequestingCode}
                        >
                            {isRequestingCode ? "Отправляем..." : "Подтвердить почту"}
                            <ArrowRight size={15} />
                        </button>
                    )}
                </div>
            )}

            {codeError && <p className="notification-error" role="alert">{codeError}</p>}

            <div className="notification-list">
                {items.map((item) => {
                    const Icon = item.icon;
                    const locked = item.key === "email" && emailLocked;

                    return (
                        <div className={`notification-item ${locked ? "locked" : ""}`} key={item.key}>
                            <div className="notification-icon">
                                <Icon size={19} />
                            </div>

                            <div className="notification-info">
                                <h4>{item.title}</h4>
                                <p>
                                    {locked
                                        ? "Недоступно: подтверди почту, чтобы включить"
                                        : item.description}
                                </p>
                            </div>

                            <button
                                type="button"
                                role="switch"
                                aria-checked={prefs ? prefs[item.key] : false}
                                aria-label={item.title + (locked ? " (недоступно до подтверждения почты)" : "")}
                                title={locked ? "Доступно после подтверждения почты" : undefined}
                                className={`notification-switch ${prefs && prefs[item.key] ? "active" : ""} ${locked ? "disabled" : ""}`}
                                disabled={isLoading || isSaving || locked}
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
