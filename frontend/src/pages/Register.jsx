import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrainCircuit } from "lucide-react";
import { registerUser, loginUser } from "../api/auth";
import { saveProfile } from "../api/api";
import "../styles/auth.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// должна совпадать с политикой паролей на backend (Identity: длина 8+,
// цифра, строчная и заглавная буквы, спецсимвол)
function validatePassword(password) {
    const problems = [];

    if (password.length < 8) problems.push("минимум 8 символов");
    if (!/[0-9]/.test(password)) problems.push("хотя бы одна цифра");
    if (!/[a-z]/.test(password)) problems.push("хотя бы одна строчная буква");
    if (!/[A-Z]/.test(password)) problems.push("хотя бы одна заглавная буква");
    if (!/[^a-zA-Z0-9]/.test(password)) problems.push("хотя бы один спецсимвол");

    return problems;
}

function validateFields({ name, email, password, confirmPassword, age }) {
    if (!name.trim()) return "Введите имя пользователя";

    if (!email.trim()) return "Введите электронную почту";
    if (!EMAIL_RE.test(email.trim())) return "Введите корректную электронную почту";

    if (!password) return "Введите пароль";
    const problems = validatePassword(password);
    if (problems.length) {
        return "Пароль должен содержать: " + problems.join(", ");
    }

    if (!confirmPassword) return "Повторите пароль";
    if (password !== confirmPassword) return "Пароли не совпадают";

    if (!String(age).trim()) return "Укажите возраст";
    const ageNum = Number(age);
    if (!Number.isInteger(ageNum)) return "Возраст должен быть целым числом";
    if (ageNum < 10 || ageNum > 120) return "Возраст должен быть от 10 до 120";

    return null;
}

function Register() {
const navigate = useNavigate();
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [age, setAge] = useState("");
const [error, setError] = useState("");
const [isLoading, setIsLoading] = useState(false);

const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateFields({ name, email, password, confirmPassword, age });
    if (validationError) {
        setError(validationError);
        return;
    }

    setIsLoading(true);

    const cleanEmail = email.trim();

    try {
        await registerUser(cleanEmail, password);
    } catch (error) {
        // ошибка регистрации (занятая почта, политика паролей сервера) — показываем
        setError(error.message);
        setIsLoading(false);
        return;
    }

    let token = null;

    try {
        const data = await loginUser(cleanEmail, password);
        token = data.accessToken;
    } catch {
        // аккаунт создан, но авто-вход не удался — направляем на страницу входа
        setIsLoading(false);
        navigate("/login", { replace: true });
        return;
    }

    // сохраняем имя и возраст, введённые при регистрации, в профиль
    try {
        const response = await fetch("http://localhost:5056/api/Profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                name: name.trim(),
                age: Number(age)
            })
        });

        if (!response.ok) {
            // профиль не сохранился, но аккаунт создан — пользователь
            // сможет заполнить данные в профиле
            console.error("Не удалось сохранить данные профиля после регистрации");
        }
    } catch (error) {
        console.error("Ошибка сохранения профиля после регистрации:", error);
    }

    setIsLoading(false);
    navigate("/", { replace: true });
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

            <form onSubmit={handleRegister} noValidate>
                <input
                    type="text"
                    placeholder="Имя пользователя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                />

                <input
                    type="email"
                    placeholder="Электронная почта"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                />

                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                />
                <p className="auth-hint">Минимум 8 символов: цифра, строчная и заглавная буквы, спецсимвол</p>

                <input
                    type="password"
                    placeholder="Повторите пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                />

                <input
                    type="number"
                    placeholder="Возраст"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="10"
                    max="120"
                    autoComplete="off"
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
