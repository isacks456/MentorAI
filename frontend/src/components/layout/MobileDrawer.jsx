import { useEffect, useRef } from "react";

import Sidebar from "./Sidebar";
import "./MobileDrawer.css";

/**
 * Мобильный drawer с навигацией. Показывается на ширинах <= 900px
 * вместо скрытого Sidebar. Закрывается: по клику вне меню, по Escape
 * и после выбора страницы.
 */
function MobileDrawer({ open, onClose }) {
    const drawerRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        // блокируем прокрутку фоновой страницы
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        document.addEventListener("keydown", handleKeyDown);

        // фокус внутрь меню для навигации с клавиатуры
        const firstLink = drawerRef.current?.querySelector("a, button");
        firstLink?.focus();

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="drawer-overlay"
            onClick={onClose}
            aria-hidden="false"
        >
            <aside
                ref={drawerRef}
                className="drawer"
                id="mobile-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Меню навигации"
                onClick={(event) => event.stopPropagation()}
            >
                <Sidebar variant="drawer" onNavigate={onClose} />
            </aside>
        </div>
    );
}

export default MobileDrawer;
