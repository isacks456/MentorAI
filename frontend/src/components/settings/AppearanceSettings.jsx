import { Palette, Sun, Moon, Monitor, SwatchBook, Check } from "lucide-react";
import "./AppearanceSettings.css";

const THEME_OPTIONS = [
    { id: "dark", label: "Тёмная", icon: Moon },
    { id: "light", label: "Светлая", icon: Sun },
    { id: "system", label: "Системная", icon: Monitor },
];

const ACCENT_OPTIONS = [
    { id: "blue", color: "#1d9bf0", label: "Синий" },
    { id: "purple", color: "#8b5cf6", label: "Фиолетовый" },
    { id: "green", color: "#10b981", label: "Зелёный" },
    { id: "orange", color: "#f97316", label: "Оранжевый" },
    { id: "pink", color: "#ec4899", label: "Розовый" },
];

function AppearanceSettings({ theme, setTheme, accent, setAccent }) {
    return (
        <section className="appearance-settings">
            <div className="appearance-heading">
                <div>
                    <h3>Внешний вид</h3>
                    <p>Настрой интерфейс под свои предпочтения</p>
                </div>

                <Palette size={22} />
            </div>

            <div className="appearance-option">
                <div className="appearance-option-info">
                    <h4>Тема оформления</h4>
                    <p>Выбери удобный вариант оформления приложения</p>
                </div>

                <div className="theme-options" role="radiogroup" aria-label="Тема оформления">
                    {THEME_OPTIONS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            className={`theme-option ${theme === id ? "active" : ""}`}
                            aria-pressed={theme === id}
                            onClick={() => setTheme(id)}
                        >
                            <Icon size={15} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="appearance-option">
                <div className="appearance-option-info">
                    <h4>Акцентный цвет</h4>
                    <p>Цвет кнопок, активных пунктов меню и ссылок</p>
                </div>

                <div className="accent-options" role="radiogroup" aria-label="Акцентный цвет">
                    {ACCENT_OPTIONS.map(({ id, color, label }) => (
                        <button
                            key={id}
                            type="button"
                            className={`accent-option ${accent === id ? "active" : ""}`}
                            style={{ "--accent-swatch": color }}
                            aria-label={`Акцентный цвет: ${label}`}
                            aria-pressed={accent === id}
                            title={label}
                            onClick={() => setAccent(id)}
                        >
                            {accent === id && <Check size={14} />}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default AppearanceSettings;
