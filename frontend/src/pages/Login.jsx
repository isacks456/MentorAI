import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrainCircuit } from "lucide-react";
import { loginUser } from "../api/auth";
import PasswordInput from "../components/PasswordInput";
import "../styles/auth.css";

function Login() {
const navigate = useNavigate();
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [isLoading, setIsLoading] = useState(false);

const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
        await loginUser(email, password);
        navigate("/");
    } catch (error) {
        setError(error.message);
    } finally {
        setIsLoading(false);
    }
};

return (
    <div className="auth-page">
        <div className="auth-card">
            <div className="auth-logo">
                <BrainCircuit size={22} />
                MentorAI
            </div>

            <h1>Вход</h1>
            <p className="auth-subtitle">С возвращением! Продолжай обучение с AI-наставником</p>

            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Электронная почта"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <PasswordInput
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {error && <p className="auth-error" role="alert">{error}</p>}

                <button className="auth-submit" type="submit" disabled={isLoading}>
                    {isLoading ? "Входим..." : "Войти"}
                </button>
            </form>

            <p className="auth-switch">
                Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </p>
        </div>
    </div>
);
}

export default Login;
