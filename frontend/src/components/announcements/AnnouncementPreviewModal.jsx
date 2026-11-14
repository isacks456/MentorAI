import { X } from "lucide-react";
import { useEffect } from "react";

import "./AnnouncementModal.css";

// Модальное окно серверного предпросмотра письма.
// HTML приходит с backend уже с экранированным пользовательским текстом
// и рендерится в изолированном iframe (sandbox) — скрипты запрещены.
function AnnouncementPreviewModal({ html, onClose }) {
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === "Escape") onClose();
        };

        document.addEventListener("keydown", onKeyDown);

        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <div className="announcement-modal-overlay" onClick={onClose}>
            <div
                className="announcement-preview-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Предпросмотр письма"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="announcement-preview-head">
                    <div>
                        <h3>Предпросмотр письма</h3>
                        <p>Так получатель увидит анонс в почте</p>
                    </div>

                    <button
                        type="button"
                        className="announcement-modal-close"
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="announcement-preview-body">
                    <iframe
                        title="Предпросмотр письма"
                        srcDoc={html}
                        sandbox=""
                    />
                </div>

                <div className="announcement-preview-foot">
                    <span>Отправляется и тестовым получателям, и пользователям именно в таком виде.</span>
                    <button type="button" className="announcement-button ghost" onClick={onClose}>
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AnnouncementPreviewModal;
