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
        navigate("/login");
		await loginUser(email, password);
		navigate("/");
    } catch (error) {
        setError(error.message);
    } finally {
        setIsLoading(false);
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