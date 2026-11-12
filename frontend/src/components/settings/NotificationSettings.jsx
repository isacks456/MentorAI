import { Bell, Mail, MessageSquare, Trophy } from "lucide-react";
import "./NotificationSettings.css";

import { useState, useEffect } from "react";

function NotificationSettings() {

    const [enabledNotifications, setEnabledNotifications] = useState(() => {
        const savedSettings = localStorage.getItem("mentorai-notifications");

        return savedSettings
        ? JSON.parse(savedSettings)
        : [true, true, true];
    });

    useEffect(() => {
        localStorage.setItem(
            "mentorai-notifications",
            JSON.stringify(enabledNotifications)
        );
    }, [enabledNotifications]);

    const notifications = [
        {
            title: "Уведомления по электронной почте",
            description: "Получать важные сообщения на почту",
            icon: Mail
        },
        {
            title: "Ответы AI-наставника",
            description: "Уведомления о новых ответах в диалогах",
            icon: MessageSquare
        },
        {
            title: "Напоминания об обучении",
            description: "Напоминания о незавершённых заданиях",
            icon: Trophy
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

            <div className="notification-list">
                {notifications.map((item, index) => {
                    const Icon = item.icon;

                    return (
                        <div className="notification-item" key={index}>
                            <div className="notification-icon">
                                <Icon size={19} />
                            </div>

                            <div className="notification-info">
                                <h4>{item.title}</h4>
                                <p>{item.description}</p>
                            </div>

                            <button
                                type="button"
                                className={`notification-switch ${enabledNotifications[index] ? "active" : ""}`}
                                onClick={() => {
                                    setEnabledNotifications(prev =>
                                        prev.map((enabled, i) =>
                                            i === index ? !enabled : enabled
                                        )
                                    );
                                }}
                            >
                                <span></span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default NotificationSettings;
