import { Megaphone, ShieldCheck } from "lucide-react";
import "./AnnouncementsHeader.css";

// Заголовок страницы анонсов. Повторяет стиль SettingsHeader,
// чтобы сохранить единый дизайн MentorAI.
function AnnouncementsHeader() {
    return (
        <section className="announcements-header">
            <div className="announcements-header-info">
                <div className="announcements-header-icon">
                    <Megaphone size={24} />
                </div>

                <div>
                    <h2>Анонсы</h2>
                    <p>Создавай объявления и рассылай их пользователям по электронной почте</p>
                </div>
            </div>

            <div className="announcements-header-label">
                <ShieldCheck size={17} />
                <span>Только для администраторов</span>
            </div>
        </section>
    );
}

export default AnnouncementsHeader;
