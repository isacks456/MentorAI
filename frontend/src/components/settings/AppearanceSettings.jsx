import { Palette, Sun, Moon, Monitor, Type } from "lucide-react";
import "./AppearanceSettings.css";

function AppearanceSettings({ theme, setTheme }) {
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

                <div className="theme-options">
                    <button
                        type="button"
                        className={`theme-option ${theme === "dark" ? "active" : ""}`}
                        onClick={() => setTheme("dark")}
                    ></button>

                    <button
                        type="button"
                        className={`theme-option ${theme === "light" ? "active" : ""}`}
                        onClick={() => setTheme("light")}
                    ></button>

                    <button
                        type="button"
                        className={`theme-option ${theme === "system" ? "active" : ""}`}
                        onClick={() => setTheme("system")}
                    ></button>
                </div>
            </div>

            <div className="appearance-option font-option">
                <div className="appearance-option-info">
                    <h4>Размер текста</h4>
                    <p>Настрой размер текста для удобного чтения</p>
                </div>

                <div className="font-size-options">
                    <button type="button">А</button>
                    <button type="button" className="active">А</button>
                    <button type="button">А</button>
                </div>
            </div>
        </section>
    );
}

export default AppearanceSettings;
