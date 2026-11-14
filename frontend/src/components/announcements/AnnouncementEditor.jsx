import { useEffect, useState } from "react";
import {
    Save, Eye, Send, Square, Play, MailCheck, FileText,
    AlertTriangle, CheckCircle2, XCircle, Clock
} from "lucide-react";

import StatusBadge from "./StatusBadge";
import AnnouncementStats from "./AnnouncementStats";
import { formatDateTime } from "./utils";
import "./AnnouncementModal.css";
import "./AnnouncementEditor.css";

const TITLE_MAX = 200;
const BODY_MAX = 8000;

// Панель работы с выбранным анонсом.
// Draft  — редактирование, предпросмотр, тест, запуск.
// Sending — прогресс и остановка.
// Sent/Failed/Cancelled — статистика и (при необходимости) возобновление.
function AnnouncementEditor({
    announcement,
    mode,
    busy,
    testResult,
    onSave,
    onPreview,
    onTest,
    onSend,
    onStop,
    onResume
}) {
    const isNew = mode === "new";

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [requeueFailed, setRequeueFailed] = useState(false);
    const [requeueUndefined, setRequeueUndefined] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    // Синхронизируем форму при смене выбранного анонса.
    useEffect(() => {
        setTitle(announcement?.title ?? "");
        setBody(announcement?.body ?? "");
        setRequeueFailed(false);
        setRequeueUndefined(false);
        setConfirmAction(null);
    }, [announcement?.id, announcement?.title, announcement?.body, isNew]);

    if (!announcement && !isNew) {
        return (
            <section className="announcement-editor announcement-editor-empty">
                <FileText size={30} />
                <h3>Выберите анонс</h3>
                <p>Выберите запись слева или создайте новый анонс кнопкой «Новый».</p>
            </section>
        );
    }

    const status = announcement?.status ?? "Draft";
    const stats = announcement?.stats ?? null;
    const isDraft = status === "Draft";
    const isSending = status === "Sending";
    const isDone = status === "Sent" || status === "Failed" || status === "Cancelled";
    const canResume = (status === "Cancelled" || status === "Failed")
        && (stats?.pending ?? 0) > 0;

    const titleTooLong = title.length > TITLE_MAX;
    const bodyTooLong = body.length > BODY_MAX;
    const canSave = title.trim().length > 0 && body.trim().length > 0 && !titleTooLong && !bodyTooLong;
    const anyBusy = Boolean(busy);

    const processed = stats ? stats.total - stats.pending : 0;
    const progressPercent = stats && stats.total > 0
        ? Math.round((processed / stats.total) * 100)
        : 0;

    const runConfirmed = () => {
        const action = confirmAction;
        setConfirmAction(null);

        if (action === "send") onSend();
        if (action === "stop") onStop();
        if (action === "resume") onResume({ requeueFailed, requeueUndefined });
    };

    const confirmText = {
        send: {
            title: "Запустить рассылку?",
            text: "Письмо уйдёт всем пользователям с подтверждённой почтой и включёнными уведомлениями. Запущенную рассылку можно будет остановить.",
            button: "Запустить",
            danger: false
        },
        stop: {
            title: "Остановить рассылку?",
            text: "Уже обработанные письма останутся отправленными. Остальные получатели перейдут в статус «в очереди» — их можно будет дослать возобновлением.",
            button: "Остановить",
            danger: true
        },
        resume: {
            title: "Возобновить рассылку?",
            text: "Будут обработаны получатели в статусе «в очереди». Отмеченные ниже категории тоже будут отправлены повторно.",
            button: "Возобновить",
            danger: false
        }
    }[confirmAction] || null;

    return (
        <section className="announcement-editor">
            <div className="announcement-editor-head">
                <div className="announcement-editor-head-info">
                    <h3>{isNew ? "Новый анонс" : "Анонс"}</h3>
                    {!isNew && (
                        <div className="announcement-editor-meta">
                            <StatusBadge status={status} />
                            <span>создан {formatDateTime(announcement.createdAt)}</span>
                            {announcement.sentAt && <span>· завершён {formatDateTime(announcement.sentAt)}</span>}
                            {announcement.lastTestSentAt && (
                                <span>· тест {formatDateTime(announcement.lastTestSentAt)}</span>
                            )}
                        </div>
                    )}
                </div>

                <div className="announcement-editor-actions">
                    <button
                        type="button"
                        className="announcement-button ghost"
                        onClick={() => onPreview(title, body)}
                        disabled={anyBusy || !title.trim() || !body.trim()}
                    >
                        <Eye size={15} />
                        Предпросмотр
                    </button>

                    {isDraft && (
                        <>
                            <button
                                type="button"
                                className="announcement-button ghost"
                                onClick={onTest}
                                disabled={anyBusy || isNew}
                                title={isNew ? "Сначала сохраните черновик" : "Отправить тестовое письмо тестовым получателям"}
                            >
                                <MailCheck size={15} />
                                Тест
                            </button>

                            <button
                                type="button"
                                className="announcement-button primary"
                                onClick={() => onSave(title, body)}
                                disabled={anyBusy || !canSave}
                            >
                                <Save size={15} />
                                {isNew ? "Создать черновик" : "Сохранить"}
                            </button>

                            {!isNew && (
                                <button
                                    type="button"
                                    className="announcement-button primary"
                                    onClick={() => setConfirmAction("send")}
                                    disabled={anyBusy}
                                >
                                    <Send size={15} />
                                    Запустить рассылку
                                </button>
                            )}
                        </>
                    )}

                    {isSending && (
                        <button
                            type="button"
                            className="announcement-button warning"
                            onClick={() => setConfirmAction("stop")}
                            disabled={anyBusy}
                        >
                            <Square size={15} />
                            Остановить
                        </button>
                    )}

                    {isDone && canResume && (
                        <button
                            type="button"
                            className="announcement-button primary"
                            onClick={() => setConfirmAction("resume")}
                            disabled={anyBusy}
                        >
                            <Play size={15} />
                            Возобновить
                        </button>
                    )}
                </div>
            </div>

            {(isDraft || isNew) && (
                <div className="announcement-editor-form">
                    <label className="announcement-field">
                        <span className="announcement-field-label">
                            Заголовок
                            <em className={titleTooLong ? "over" : ""}>{title.length}/{TITLE_MAX}</em>
                        </span>
                        <input
                            type="text"
                            value={title}
                            maxLength={TITLE_MAX}
                            placeholder="Например: Обновление MentorAI"
                            onChange={(event) => setTitle(event.target.value)}
                            disabled={anyBusy}
                        />
                    </label>

                    <label className="announcement-field">
                        <span className="announcement-field-label">
                            Текст анонса
                            <em className={bodyTooLong ? "over" : ""}>{body.length}/{BODY_MAX}</em>
                        </span>
                        <textarea
                            value={body}
                            maxLength={BODY_MAX}
                            rows={8}
                            placeholder="Напиши текст письма. Абзацы разделяй пустой строкой."
                            onChange={(event) => setBody(event.target.value)}
                            disabled={anyBusy}
                        />
                    </label>
                </div>
            )}

            {!isDraft && !isNew && (
                <div className="announcement-editor-readonly">
                    <h4>{announcement.title}</h4>
                    <p>{announcement.body}</p>
                </div>
            )}

            {isSending && stats && (
                <div className="announcement-progress">
                    <div className="announcement-progress-head">
                        <span>Обработано {processed} из {stats.total}</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <div className="announcement-progress-bar">
                        <div className="announcement-progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <p className="announcement-progress-note">
                        Рассылка идёт в фоне. Статистика обновляется автоматически.
                    </p>
                </div>
            )}

            {!isNew && stats && (
                <div className="announcement-editor-stats">
                    <h4>Статистика доставки</h4>
                    <AnnouncementStats stats={stats} />
                </div>
            )}

            {isDone && canResume && (
                <div className="announcement-resume-options">
                    <h4>Возобновление</h4>
                    <p>По умолчанию досылаются только получатели из очереди. Дополнительно можно переотправить:</p>

                    <label className="announcement-checkbox">
                        <input
                            type="checkbox"
                            checked={requeueFailed}
                            onChange={(event) => setRequeueFailed(event.target.checked)}
                            disabled={anyBusy}
                        />
                        <span>
                            Ошибки доставки ({stats?.failed ?? 0}) — письма, которые точно не ушли
                        </span>
                    </label>

                    <label className="announcement-checkbox">
                        <input
                            type="checkbox"
                            checked={requeueUndefined}
                            onChange={(event) => setRequeueUndefined(event.target.checked)}
                            disabled={anyBusy}
                        />
                        <span>
                            Неизвестный результат ({stats?.undefined ?? 0}) — возможен дубль письма
                        </span>
                    </label>
                </div>
            )}

            {testResult && (
                <div className={`announcement-test-result ${testResult.ok ? "ok" : "fail"}`}>
                    <div className="announcement-test-head">
                        {testResult.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        <strong>{testResult.message}</strong>
                    </div>

                    {testResult.items?.length > 0 && (
                        <ul className="announcement-test-list">
                            {testResult.items.map((item, index) => (
                                <li key={index}>
                                    {item.delivered
                                        ? <CheckCircle2 size={14} className="ok" />
                                        : <XCircle size={14} className="err" />}
                                    <span>{item.email}</span>
                                    {!item.delivered && item.reason && <em>{item.reason}</em>}
                                </li>
                            ))}
                        </ul>
                    )}

                    {testResult.hint && <p className="announcement-test-hint"><Clock size={13} /> {testResult.hint}</p>}
                </div>
            )}

            {isNew && (
                <div className="announcement-editor-hint">
                    <AlertTriangle size={15} />
                    <span>
                        Сначала сохраните черновик кнопкой «Создать черновик». После этого станут доступны
                        предпросмотр, тестовая отправка и запуск рассылки.
                    </span>
                </div>
            )}

            {confirmAction && confirmText && (
                <div className="announcement-modal-overlay" onClick={() => setConfirmAction(null)}>
                    <div
                        className="announcement-confirm"
                        role="dialog"
                        aria-modal="true"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className={`announcement-confirm-icon ${confirmText.danger ? "danger" : ""}`}>
                            {confirmText.danger ? <AlertTriangle size={20} /> : <Send size={20} />}
                        </div>
                        <h3>{confirmText.title}</h3>
                        <p>{confirmText.text}</p>

                        <div className="announcement-confirm-actions">
                            <button
                                type="button"
                                className="announcement-button ghost"
                                onClick={() => setConfirmAction(null)}
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                className={`announcement-button ${confirmText.danger ? "danger" : "primary"}`}
                                onClick={runConfirmed}
                                disabled={anyBusy}
                            >
                                {confirmText.button}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default AnnouncementEditor;
