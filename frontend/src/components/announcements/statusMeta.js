// Метаданные статусов анонса и получателя: подписи и цветовые тона.
// Цветовые тона соответствуют токенам темы (см. styles/theme.css).

export const ANNOUNCEMENT_STATUS = {
    Draft: {
        label: "Черновик",
        tone: "neutral",
        description: "Готов к редактированию, рассылка не запускалась"
    },
    Sending: {
        label: "Отправляется",
        tone: "accent",
        description: "Рассылка выполняется прямо сейчас"
    },
    Sent: {
        label: "Отправлен",
        tone: "success",
        description: "Рассылка завершена без ошибок"
    },
    Failed: {
        label: "Завершён с ошибками",
        tone: "danger",
        description: "Часть писем не доставлена или результат неизвестен"
    },
    Cancelled: {
        label: "Остановлен",
        tone: "warning",
        description: "Рассылка остановлена; часть получателей не обработана"
    }
};

export function getAnnouncementStatus(status) {
    return ANNOUNCEMENT_STATUS[status] || {
        label: status || "Неизвестно",
        tone: "neutral",
        description: ""
    };
}

// Порядок и подписи статистики получателей.
export const RECIPIENT_STATS = [
    { key: "sent", label: "Доставлено", tone: "success", hint: "SMTP подтвердил приём письма" },
    { key: "skipped", label: "Пропущено", tone: "neutral", hint: "Почта не подтверждена или уведомления выключены" },
    { key: "failed", label: "Ошибка", tone: "danger", hint: "Достоверно не доставлено" },
    { key: "undefined", label: "Неизвестно", tone: "warning", hint: "Результат доставки не определён" },
    { key: "pending", label: "В очереди", tone: "accent", hint: "Ещё не обработано" }
];

export function isActive(status) {
    return status === "Sending";
}
