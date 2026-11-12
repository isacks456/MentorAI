import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";

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
    <div>
        <h1>Вход в MentorAI</h1>

        <form onSubmit={handleLogin}>
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

            {error && <p>{error}</p>}

            <button type="submit" disabled={isLoading}>
                {isLoading ? "Входим..." : "Войти"}
            </button>
        </form>

        <p>
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
    </div>
);
}

export default Login;