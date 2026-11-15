import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./PasswordInput.css";

// Переиспользуемое поле пароля с кнопкой показа/скрытия.
// Видимость — собственное состояние каждого экземпляра, поэтому
// соседние поля переключаются независимо.
function PasswordInput({ className = "", ...props }) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="password-field">
            <input
                {...props}
                type={visible ? "text" : "password"}
                className={className}
            />

            <button
                type="button"
                className="password-toggle"
                onClick={() => setVisible((value) => !value)}
                aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
                aria-pressed={visible}
                disabled={props.disabled}
            >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
}

export default PasswordInput;
