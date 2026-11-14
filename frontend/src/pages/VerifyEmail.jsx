import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrainCircuit, MailCheck, RefreshCw, ArrowLeft, CheckCircle2 } from "lucide-react";
import {
    getEmailStatus,
    sendEmailCode,
    verifyEmailCode
} from "../api/api";
import "../styles/verify-email.css";

function VerifyEmail() {
const navigate = useNavigate();

const [digits, setDigits] = useState(["", "", "", "", "", ""]);
const [email, setEmail] = useState("");
const [isLoading, setIsLoading] = useState(true);
const [isVerifying, setIsVerifying] = useState(false);
const [isResending, setIsResending] = useState(false);
const [error, setError] = useState("");
// success — почта подтверждена (блокирует повторную отправку формы);
// notice — служебное сообщение (например, «код отправлен повторно»),
// которое НЕ должно блокировать кнопку подтверждения.
const [success, setSuccess] = useState("");
const [notice, setNotice] = useState("");
const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);
// codeIssued — был ли уже выдан код (в этой сессии или ранее): влияет на надпись кнопки
const [codeIssued, setCodeIssued] = useState(false);

// защита от повторной авто-отправки (в т.ч. двойной вызов эффекта в StrictMode)
const autoSentRef = useRef(false);

// серверные времена (мс, приведённые к локальным часам клиента через смещение)
const expiryRef = useRef(null);      // { ms: <expiresAt локального времени> }
const resendRef = useRef(null);      // { ms: <resendAvailableAt> }
const [expiresInSec, setExpiresInSec] = useState(null);
const [resendInSec, setResendInSec] = useState(0);

const inputsRef = useRef([]);

// перевод абсолютного серверного времени (UTC ISO) в локальную временную шкалу
// с учётом разницы часов клиент/сервер (serverNow присылает сервер)
const toLocalTimeline = (serverNowIso, targetIso) => {
    const skew = Date.now() - new Date(serverNowIso).getTime();
    return new Date(targetIso).getTime() + skew;
};

// Автоматическая отправка первого кода при входе на страницу, если
// активного кода ещё нет (например, сразу после регистрации).
const autoSendFirstCode = async () => {
    try {
        const result = await sendEmailCode();

        if (result.emailConfirmed) {
            setAlreadyConfirmed(true);
            return;
        }

        if (result.smtpNotConfigured) {
            setError(result.message);
            return;
        }

        setCodeIssued(true);
        setNotice("Код отправлен на вашу почту");

        if (result.expiresAt) {
            expiryRef.current = { ms: toLocalTimeline(new Date().toISOString(), result.expiresAt) };
        }

        resendRef.current = { ms: Date.now() + 60 * 1000 };
    } catch (err) {
        // 429 (кулдаун/лимит) означает, что код уже был отправлен — не ошибка для пользователя
        if (err.retryAfter) {
            resendRef.current = { ms: Date.now() + err.retryAfter * 1000 };
            setCodeIssued(true);
        } else {
            setError(err.message);
        }
    } finally {
        setIsLoading(false);
    }
};

useEffect(() => {
    const token = sessionStorage.getItem("mentorai-token");

    if (!token) {
        navigate("/login", { replace: true });
        return;
    }

    let cancelled = false;

    const load = async () => {
        try {
            const status = await getEmailStatus();

            if (cancelled) return;

            setEmail(status.email);
            setAlreadyConfirmed(status.emailConfirmed);

            if (status.expiresAt && !status.emailConfirmed) {
                expiryRef.current = { ms: toLocalTimeline(status.serverNow, status.expiresAt) };
                setCodeIssued(true);
            } else {
                expiryRef.current = null;
            }

            if (status.resendAvailableAt && !status.emailConfirmed) {
                resendRef.current = { ms: toLocalTimeline(status.serverNow, status.resendAvailableAt) };
            } else {
                resendRef.current = null;
            }

            // после регистрации кода ещё нет — отправляем первый код автоматически
            if (!status.emailConfirmed && !status.expiresAt && !autoSentRef.current) {
                autoSentRef.current = true;
                await autoSendFirstCode();
            } else {
                setIsLoading(false);
            }
        } catch (err) {
            if (!cancelled) {
                setError(err.message);
                setIsLoading(false);
            }
        }
    };

    load();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// таймеры обновляются каждую секунду от серверных меток времени
useEffect(() => {
    if (isLoading || alreadyConfirmed) return;

    const tick = () => {
        const now = Date.now();

        if (expiryRef.current) {
            const left = Math.max(0, Math.floor((expiryRef.current.ms - now) / 1000));
            setExpiresInSec(left);
        } else {
            setExpiresInSec(null);
        }

        if (resendRef.current) {
            const left = Math.max(0, Math.ceil((resendRef.current.ms - now) / 1000));
            setResendInSec(left);
        } else {
            setResendInSec(0);
        }
    };

    tick();
    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
}, [isLoading, alreadyConfirmed]);

const handleChange = (index, value) => {
    if (alreadyConfirmed) return;

    setNotice("");

    const cleaned = value.replace(/\D/g, "");

    if (!cleaned) {
        setDigits(prev => prev.map((d, i) => i === index ? "" : d));
        return;
    }

    // вставка/набор нескольких цифр распределяется по полям
    const next = [...digits];
    let pos = index;

    for (const ch of cleaned) {
        if (pos > 5) break;
        next[pos] = ch;
        pos++;
    }

    setDigits(next);

    const focusTarget = Math.min(pos, 5);
    inputsRef.current[focusTarget]?.focus();
};

const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
        setDigits(prev => prev.map((d, i) => i === index - 1 ? "" : d));
    }

    if (e.key === "ArrowLeft" && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputsRef.current[index + 1]?.focus();
};

const handlePaste = (e) => {
    if (alreadyConfirmed) return;

    const text = e.clipboardData.getData("text").replace(/\D/g, "");

    if (!text) return;

    e.preventDefault();

    const next = ["", "", "", "", "", ""];
    [...text].slice(0, 6).forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    inputsRef.current[Math.min(text.length, 5)]?.focus();
};

const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setNotice("");

    const code = digits.join("");

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        setError("Введите все 6 цифр кода");
        return;
    }

    if (expiresInSec === 0) {
        setError("Код истёк. Отправьте новый код");
        return;
    }

    setIsVerifying(true);

    try {
        const result = await verifyEmailCode(code);
        setSuccess(result.message || "Почта успешно подтверждена");
        setAlreadyConfirmed(true);
        setExpiresInSec(null);
        setTimeout(() => navigate("/", { replace: true }), 1800);
    } catch (err) {
        setError(err.message);
    } finally {
        setIsVerifying(false);
    }
};

const handleResend = async () => {
    setError("");
    setSuccess("");
    setNotice("");
    setIsResending(true);

    try {
        const result = await sendEmailCode();

        if (result.smtpNotConfigured) {
            setError(result.message);
            return;
        }

        setNotice("Новый код отправлен на вашу почту");
        setCodeIssued(true);
        setDigits(["", "", "", "", "", ""]);
        inputsRef.current[0]?.focus();
        expiryRef.current = { ms: toLocalTimeline(new Date().toISOString(), new Date(Date.now() + 10 * 60 * 1000).toISOString()) };
        resendRef.current = { ms: toLocalTimeline(new Date().toISOString(), new Date(Date.now() + 60 * 1000).toISOString()) };
    } catch (err) {
        setError(err.message);
        if (err.retryAfter) {
            resendRef.current = { ms: Date.now() + err.retryAfter * 1000 };
        }
    } finally {
        setIsResending(false);
    }
};

const formatTime = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
};

return (
    <div className="auth-page">
        <div className="auth-card verify-email-card">
            <div className="auth-logo">
                <BrainCircuit size={22} />
                MentorAI
            </div>

            <div className="verify-icon">
                <MailCheck size={30} />
            </div>

            <h1>Подтвердите электронную почту</h1>
            <p className="auth-subtitle">
                Мы отправили шестизначный код на
                <br />
                <b className="verify-email-address">{isLoading ? "..." : email}</b>
            </p>

            {isLoading ? (
                <p className="verify-status">Загрузка...</p>
            ) : alreadyConfirmed ? (
                <>
                    <p className="verify-success" role="status">
                        <CheckCircle2 size={17} />
                        Почта уже подтверждена
                    </p>
                    <Link to="/" className="verify-back">Перейти в приложение</Link>
                </>
            ) : (
                <form onSubmit={handleVerify} noValidate>
                    <div className="verify-code-row" onPaste={handlePaste}>
                        {digits.map((digit, i) => (
                            <input
                                key={i}
                                ref={el => inputsRef.current[i] = el}
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                className={`verify-digit ${digit ? "filled" : ""}`}
                                value={digit}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                aria-label={`Цифра кода ${i + 1} из 6`}
                                disabled={isVerifying}
                            />
                        ))}
                    </div>

                    {expiresInSec !== null && (
                        <p className={`verify-timer ${expiresInSec <= 60 ? "warn" : ""}`} aria-live="polite">
                            {expiresInSec > 0
                                ? `Код действует ещё ${formatTime(expiresInSec)}`
                                : "Срок действия кода истёк"}
                        </p>
                    )}

                    {error && <p className="auth-error" role="alert">{error}</p>}
                    {notice && <p className="verify-notice" role="status">{notice}</p>}
                    {success && <p className="verify-success" role="status"><CheckCircle2 size={17} />{success}</p>}

                    <button className="auth-submit" type="submit" disabled={isVerifying || success}>
                        {isVerifying ? "Проверяем..." : "Подтвердить"}
                    </button>
                </form>
            )}

            {!isLoading && !alreadyConfirmed && (
                <div className="verify-resend-block">
                    {resendInSec > 0 ? (
                        <p className="verify-resend-timer">Новый код можно отправить через {resendInSec} с</p>
                    ) : (
                        <button
                            type="button"
                            className="verify-resend"
                            onClick={handleResend}
                            disabled={isResending}
                        >
                            <RefreshCw size={15} />
                            {isResending
                                ? "Отправляем..."
                                : codeIssued
                                    ? "Отправить код повторно"
                                    : "Отправить код"}
                        </button>
                    )}

                    <Link to="/login" className="verify-back">
                        <ArrowLeft size={14} />
                        Вернуться ко входу
                    </Link>
                </div>
            )}
        </div>
    </div>
);
}

export default VerifyEmail;
