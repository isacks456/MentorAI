import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrainCircuit } from "lucide-react";
import { registerUser, loginUser } from "../api/auth";
import "../styles/auth.css";

function Register() {
const navigate = useNavigate();
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [error, setError] = useState("");
const [isLoading, setIsLoading] = useState(false);

const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
        setError("Пароли не совпадают");
        return;
    }

    setIsLoading(true);

    try {
        await registerUser(email, password);
    } catch (error) {
        // ошибка регистрации — остаёмся на странице и показываем сообщение
        setError(error.message);
        setIsLoading(false);
        return;
    }

    try {
        await loginUser(email, password);
        setIsLoading(false);
        navigate("/", { replace: true });
    } catch {
        // аккаунт создан, но авто-вход не удался — направляем на страницу входа
        setIsLoading(false);
        navigate("/login", { replace: true });
    }
};

return (
    <div className="auth-page">
        <div className="auth-card">
            <div className="auth-logo">
                <BrainCircuit size={22} />
                MentorAI
            </div>

            <h1>Регистрация</h1>
            <p className="auth-subtitle">Создай аккаунт и начни путь с персональным наставником</p>

            <form onSubmit={handleRegister}>
                <input
                    type="email"
                    placeholder="Электронная почта"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Повторите пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />

                {error && <p className="auth-error" role="alert">{error}</p>}

                <button className="auth-submit" type="submit" disabled={isLoading}>
                    {isLoading ? "Регистрируем..." : "Зарегистрироваться"}
                </button>
            </form>

            <p className="auth-switch">
                Уже есть аккаунт? <Link to="/login">Войти</Link>
            </p>
        </div>
    </div>
);
}

export default Register;
