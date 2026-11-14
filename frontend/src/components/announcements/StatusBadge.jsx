import { getAnnouncementStatus } from "./statusMeta";
import "./StatusBadge.css";

// Компактный цветной бейдж статуса анонса. tone задаёт цветовую схему.
function StatusBadge({ status }) {
    const meta = getAnnouncementStatus(status);

    return (
        <span className={`status-badge tone-${meta.tone}`} title={meta.description}>
            <span className="status-badge-dot" aria-hidden="true" />
            {meta.label}
        </span>
    );
}

export default StatusBadge;
