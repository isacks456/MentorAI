import { Settings, SlidersHorizontal } from "lucide-react";
import "./SettingsHeader.css";

function SettingsHeader() {
    return (
        <section className="settings-header">
            <div className="settings-header-info">
                <div className="settings-header-icon">
                    <Settings size={24} />
                </div>

                <div>
                    <h2>Настройки</h2>
                    <p>Управляй параметрами аккаунта и настройками приложения</p>
                </div>
            </div>

            <div className="settings-header-label">
                <SlidersHorizontal size={17} />
                <span>Персонализация</span>
            </div>
        </section>
    );
}

export default SettingsHeader;
