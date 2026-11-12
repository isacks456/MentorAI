import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../api/auth";

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
    <div>
        <h1>Регистрация в MentorAI</h1>

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

            {error && <p>{error}</p>}

            <button type="submit" disabled={isLoading}>
                {isLoading ? "Регистрируем..." : "Зарегистрироваться"}
            </button>
        </form>

        <p>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
    </div>
);
}

export default Register;