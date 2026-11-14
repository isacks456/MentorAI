import { FileText, Plus, RefreshCw } from "lucide-react";
import { useEffect, useRef } from "react";

import StatusBadge from "./StatusBadge";
import { formatDateTime } from "./utils";
import "./AnnouncementList.css";

// Список анонсов слева. Показывает заголовок, статус, дату и краткие числа.
// Персональные данные (email-ы) здесь не отображаются.
function AnnouncementList({ items, selectedId, onSelect, onCreate, isLoading, onRefresh }) {
    const listRef = useRef(null);

    // При выборе нового элемента списка — не даём скроллу уехать.
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = 0;
        }
    }, [items]);

    return (
        <aside className="announcement-list">
            <div className="announcement-list-head">
                <div>
                    <h3>Список анонсов</h3>
                    <p>{items.length} записей</p>
                </div>

                <div className="announcement-list-actions">
                    <button
                        type="button"
                        className="announcement-icon-button"
                        onClick={onRefresh}
                        title="Обновить список"
                        aria-label="Обновить список"
                        disabled={isLoading}
                    >
                        <RefreshCw size={16} className={isLoading ? "spin" : ""} />
                    </button>

                    <button
                        type="button"
                        className="announcement-add-button"
                        onClick={onCreate}
                    >
                        <Plus size={16} />
                        Новый
                    </button>
                </div>
            </div>

            <div className="announcement-list-body" ref={listRef}>
                {isLoading && items.length === 0 && (
                    <p className="announcement-list-empty">Загрузка…</p>
                )}

                {!isLoading && items.length === 0 && (
                    <div className="announcement-list-empty">
                        <FileText size={26} />
                        <p>Пока нет анонсов</p>
                        <span>Создай первый черновик, чтобы начать</span>
                    </div>
                )}

                {items.map((item) => (
                    <button
                        type="button"
                        key={item.id}
                        className={`announcement-list-item ${selectedId === item.id ? "active" : ""}`}
                        onClick={() => onSelect(item.id)}
                    >
                        <div className="announcement-list-item-top">
                            <span className="announcement-list-item-title">{item.title}</span>
                            <StatusBadge status={item.status} />
                        </div>

                        <div className="announcement-list-item-bottom">
                            <span>{formatDateTime(item.createdAt)}</span>
                            <span className="announcement-list-item-counts">
                                <span className="ok">{item.sent}</span>
                                {item.failed > 0 && <span className="err">{item.failed}</span>}
                                {item.undefined > 0 && <span className="warn">{item.undefined}</span>}
                                {item.pending > 0 && <span className="pend">{item.pending} в очереди</span>}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </aside>
    );
}

export default AnnouncementList;
