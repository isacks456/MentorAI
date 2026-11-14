import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldAlert } from "lucide-react";

import AnnouncementsHeader from "../components/announcements/AnnouncementsHeader";
import AnnouncementList from "../components/announcements/AnnouncementList";
import AnnouncementEditor from "../components/announcements/AnnouncementEditor";
import AnnouncementPreviewModal from "../components/announcements/AnnouncementPreviewModal";

import { useAdminAccess } from "../context/AdminAccessContext";

import {
    getAnnouncements,
    getAnnouncement,
    createAnnouncement,
    updateAnnouncement,
    previewAnnouncement,
    sendTestAnnouncement,
    sendAnnouncement,
    cancelAnnouncement,
    resumeAnnouncement
} from "../api/api";

import "./Announcements.css";

const POLL_INTERVAL_MS = 3000;

// Страница анонсов. Доступна только администраторам: пункт меню скрыт
// для остальных, а backend дополнительно отклоняет запросы с 403.
function Announcements() {
    const { isAdmin, loading: accessLoading } = useAdminAccess();

    const [items, setItems] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [selected, setSelected] = useState(null);
    const [mode, setMode] = useState("empty"); // empty | view | new

    const [isLoadingList, setIsLoadingList] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [previewHtml, setPreviewHtml] = useState(null);
    const [testResult, setTestResult] = useState(null);

    const pollRef = useRef(null);

    // Загрузка списка анонсов.
    const loadList = useCallback(async () => {
        setIsLoadingList(true);

        try {
            const list = await getAnnouncements();
            setItems(Array.isArray(list) ? list : []);
            setError("");
            return list;
        } catch (err) {
            setError(err.message || "Не удалось загрузить список анонсов");
            return [];
        } finally {
            setIsLoadingList(false);
        }
    }, []);

    // Загрузка деталей (без блокировки UI — для фонового обновления).
    const loadDetail = useCallback(async (id, { silent = false } = {}) => {
        if (!silent) setBusy(true);

        try {
            const detail = await getAnnouncement(id);
            setSelected(detail);
            return detail;
        } catch (err) {
            if (!silent) setError(err.message || "Не удалось загрузить анонс");
            return null;
        } finally {
            if (!silent) setBusy(false);
        }
    }, []);

    // Первичная загрузка.
    useEffect(() => {
        if (!isAdmin) return;

        loadList();
    }, [isAdmin, loadList]);

    // Фоновое обновление, пока рассылка выполняется.
    useEffect(() => {
        const active = selected?.status === "Sending";

        if (!active || !selected?.id) {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
            return undefined;
        }

        pollRef.current = setInterval(async () => {
            const detail = await loadDetail(selected.id, { silent: true });

            if (detail) {
                setItems((prev) => prev.map((item) => (item.id === detail.id ? { ...item, ...toListItem(detail) } : item)));

                if (detail.status !== "Sending") {
                    clearInterval(pollRef.current);
                    pollRef.current = null;
                }
            }
        }, POLL_INTERVAL_MS);

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [selected?.id, selected?.status, loadDetail]);

    const handleSelect = async (id) => {
        setSelectedId(id);
        setMode("view");
        setTestResult(null);
        await loadDetail(id);
    };

    const handleCreateNew = () => {
        setMode("new");
        setSelectedId(null);
        setSelected(null);
        setTestResult(null);
        setError("");
    };

    const handleRefresh = async () => {
        const list = await loadList();

        if (selectedId && list.some((item) => item.id === selectedId)) {
            await loadDetail(selectedId, { silent: true });
        }
    };

    const handleSave = async (title, body) => {
        setBusy(true);
        setError("");

        try {
            let detail;

            if (mode === "new") {
                detail = await createAnnouncement(title.trim(), body.trim());
            } else {
                detail = await updateAnnouncement(selected.id, title.trim(), body.trim());
            }

            setSelected(detail);
            setSelectedId(detail.id);
            setMode("view");
            setTestResult(null);

            await loadList();
        } catch (err) {
            setError(err.message || "Не удалось сохранить анонс");
        } finally {
            setBusy(false);
        }
    };

    const handlePreview = async (title, body) => {
        setBusy(true);
        setError("");

        try {
            const data = await previewAnnouncement(title, body);
            setPreviewHtml(data?.html || "");
        } catch (err) {
            setError(err.message || "Не удалось построить предпросмотр");
        } finally {
            setBusy(false);
        }
    };

    const handleTest = async () => {
        if (!selected?.id) return;

        setBusy(true);
        setError("");
        setTestResult(null);

        try {
            const data = await sendTestAnnouncement(selected.id);

            const delivered = (data?.items || []).filter((item) => item.delivered).length;
            const total = (data?.items || []).length;

            setTestResult({
                ok: delivered === total && total > 0,
                message: delivered === total && total > 0
                    ? `Тестовое письмо отправлено (${total})`
                    : `Доставлено ${delivered} из ${total}`,
                items: data?.items || [],
                hint: "Проверьте тестовый почтовый ящик и папку «Спам»."
            });
        } catch (err) {
            setTestResult({
                ok: false,
                message: err.message || "Тестовая отправка не выполнена",
                items: []
            });
        } finally {
            setBusy(false);
        }
    };

    const handleSend = async () => {
        if (!selected?.id) return;

        setBusy(true);
        setError("");

        try {
            await sendAnnouncement(selected.id);
            await loadDetail(selected.id, { silent: true });
            await loadList();
        } catch (err) {
            setError(err.message || "Не удалось запустить рассылку");
        } finally {
            setBusy(false);
        }
    };

    const handleStop = async () => {
        if (!selected?.id) return;

        setBusy(true);
        setError("");

        try {
            await cancelAnnouncement(selected.id);
            await loadDetail(selected.id, { silent: true });
            await loadList();
        } catch (err) {
            setError(err.message || "Не удалось остановить рассылку");
        } finally {
            setBusy(false);
        }
    };

    const handleResume = async ({ requeueFailed, requeueUndefined }) => {
        if (!selected?.id) return;

        setBusy(true);
        setError("");

        try {
            await resumeAnnouncement(selected.id, { requeueFailed, requeueUndefined });
            await loadDetail(selected.id, { silent: true });
            await loadList();
        } catch (err) {
            setError(err.message || "Не удалось возобновить рассылку");
        } finally {
            setBusy(false);
        }
    };

    // Пока проверяется доступ — не мигаем содержимым.
    if (accessLoading) {
        return (
            <div className="announcements-page">
                <p className="announcements-loading">Проверка доступа…</p>
            </div>
        );
    }

    // Не администратор: прямой заход по адресу /announcements.
    if (!isAdmin) {
        return (
            <div className="announcements-page">
                <section className="announcements-forbidden">
                    <ShieldAlert size={30} />
                    <h2>Доступ только для администраторов</h2>
                    <p>Эта страница доступна только администраторам MentorAI. Если вам нужен доступ — обратитесь к администратору.</p>
                </section>
            </div>
        );
    }

    return (
        <div className="announcements-page">
            <AnnouncementsHeader />

            {error && (
                <div className="announcements-error">
                    <span>{error}</span>
                    <button type="button" onClick={() => setError("")}>Скрыть</button>
                </div>
            )}

            <div className="announcements-layout">
                <AnnouncementList
                    items={items}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    onCreate={handleCreateNew}
                    isLoading={isLoadingList}
                    onRefresh={handleRefresh}
                />

                <AnnouncementEditor
                    announcement={selected}
                    mode={mode === "new" ? "new" : (selected ? "view" : "empty")}
                    busy={busy}
                    testResult={testResult}
                    onSave={handleSave}
                    onPreview={handlePreview}
                    onTest={handleTest}
                    onSend={handleSend}
                    onStop={handleStop}
                    onResume={handleResume}
                />
            </div>

            {previewHtml !== null && (
                <AnnouncementPreviewModal html={previewHtml} onClose={() => setPreviewHtml(null)} />
            )}
        </div>
    );
}

// Преобразование детального ответа в строку списка (для оптимистичного обновления).
function toListItem(detail) {
    return {
        title: detail.title,
        status: detail.status,
        createdAt: detail.createdAt,
        sentAt: detail.sentAt,
        lastTestSentAt: detail.lastTestSentAt,
        total: detail.stats?.total ?? 0,
        sent: detail.stats?.sent ?? 0,
        skipped: detail.stats?.skipped ?? 0,
        failed: detail.stats?.failed ?? 0,
        undefined: detail.stats?.undefined ?? 0,
        pending: detail.stats?.pending ?? 0
    };
}

export default Announcements;
