import {
    ShieldCheck,
    Eye,
    Database,
    LogOut,
    Trash2,
    ChevronRight,
    KeyRound,
    AlertTriangle,
    X
} from "lucide-react";

import "./SecuritySettings.css";

import { useState } from "react";

import { useNavigate } from "react-router-dom";

import {
    getProfile,
    getLearningProfile,
    getTrainingProgress,
    changePassword,
    deleteAccount
} from "../../api/api";

function validatePassword(password) {
    const problems = [];

    if (password.length < 8) problems.push("минимум 8 символов");
    if (!/[0-9]/.test(password)) problems.push("хотя бы одна цифра");
    if (!/[a-z]/.test(password)) problems.push("хотя бы одна строчная буква");
    if (!/[A-Z]/.test(password)) problems.push("хотя бы одна заглавная буква");
    if (!/[^a-zA-Z0-9]/.test(password)) problems.push("хотя бы один спецсимвол");

    return problems;
}

function SecuritySettings() {

    const navigate = useNavigate();

    const [showData, setShowData] = useState(false);
    const [userData, setUserData] = useState(null);
    const [learningData, setLearningData] = useState(null);
    const [trainingData, setTrainingData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // смена пароля
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // удаление аккаунта
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const handleLogout = () => {
        sessionStorage.removeItem("mentorai-token");
        navigate("/login");
    };

    const handleDataClick = async () => {
        if (showData) {
            setShowData(false);
            return;
        }

        setShowData(true);
        setIsLoading(true);

        try {
            const [profile, learning, progress] = await Promise.all([
                getProfile(),
                getLearningProfile(),
                getTrainingProgress()
            ]);

            setUserData(profile);
            setLearningData(learning);
            setTrainingData(progress);
        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
            alert("Не удалось загрузить данные");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportData = () => {
        const exportData = {
            personalInfo: userData,
            learningInfo: learningData,
            trainingProgress: trainingData,
            exportDate: new Date().toISOString()
        };

        const json = JSON.stringify(exportData, null, 4);

        const blob = new Blob([json], {
            type: "application/json"
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "mentorai-data.json";

        link.click();

        URL.revokeObjectURL(url);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess("");

        if (!currentPassword) {
            setPasswordError("Введите текущий пароль");
            return;
        }

        if (!newPassword) {
            setPasswordError("Введите новый пароль");
            return;
        }

        const problems = validatePassword(newPassword);
        if (problems.length) {
            setPasswordError("Новый пароль должен содержать: " + problems.join(", "));
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setPasswordError("Новые пароли не совпадают");
            return;
        }

        setIsChangingPassword(true);

        try {
            const result = await changePassword(currentPassword, newPassword, confirmNewPassword);

            setPasswordSuccess(result.message || "Пароль успешно изменён");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch (error) {
            setPasswordError(error.message);
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "УДАЛИТЬ") return;

        setIsDeleting(true);
        setDeleteError("");

        try {
            await deleteAccount();

            sessionStorage.removeItem("mentorai-token");
            navigate("/login", { replace: true });
        } catch (error) {
            setDeleteError(error.message);
            setIsDeleting(false);
        }
    };

    return (
        <section className="security-settings">
            <div className="security-heading">
                <div>
                    <h3>Безопасность и конфиденциальность</h3>
                    <p>Управление защитой и личными данными аккаунта</p>
                </div>

                <ShieldCheck size={22} />
            </div>

            <div className="security-list">
                <button
                    type="button"
                    className="security-item"
                    onClick={() => {
                        setShowPasswordForm(!showPasswordForm);
                        setPasswordError("");
                        setPasswordSuccess("");
                    }}
                    aria-expanded={showPasswordForm}
                >
                    <div className="security-item-icon">
                        <KeyRound size={19} />
                    </div>

                    <div className="security-item-info">
                        <h4>Смена пароля</h4>
                        <p>Обнови пароль своего аккаунта</p>
                    </div>

                    <ChevronRight size={19} />
                </button>

                {/* Функциональность управления доступом пока не реализована:
                    кнопка неактивна и явно объясняет это, чтобы не выглядеть рабочей */}
                <button
                    type="button"
                    className="security-item unavailable"
                    disabled
                    aria-disabled="true"
                    title="Функция появится в следующих обновлениях"
                >
                    <div className="security-item-icon">
                        <Eye size={19} />
                    </div>

                    <div className="security-item-info">
                        <h4>Конфиденциальность</h4>
                        <p>Скоро: управление доступом к личной информации</p>
                    </div>

                    <span className="security-item-badge">Скоро</span>
                </button>

                <button
                    type="button"
                    className="security-item"
                    onClick={handleDataClick}
                    aria-expanded={showData}
                >
                    <div className="security-item-icon">
                        <Database size={19} />
                    </div>

                    <div className="security-item-info">
                        <h4>Мои данные</h4>
                        <p>Информация, хранящаяся в MentorAI</p>
                    </div>

                    <ChevronRight size={19} />
                </button>
            </div>

            {showPasswordForm && (
                <form className="password-form" onSubmit={handleChangePassword}>
                    <h4>Смена пароля</h4>

                    <label>
                        <span>Текущий пароль</span>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            autoComplete="current-password"
                            disabled={isChangingPassword}
                            required
                        />
                    </label>

                    <label>
                        <span>Новый пароль</span>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            autoComplete="new-password"
                            disabled={isChangingPassword}
                            required
                        />
                    </label>
                    <p className="password-hint">
                        Минимум 8 символов: цифра, строчная и заглавная буквы, спецсимвол
                    </p>

                    <label>
                        <span>Подтвердите новый пароль</span>
                        <input
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            autoComplete="new-password"
                            disabled={isChangingPassword}
                            required
                        />
                    </label>

                    {passwordError && <p className="password-message error" role="alert">{passwordError}</p>}
                    {passwordSuccess && <p className="password-message success" role="status">{passwordSuccess}</p>}

                    <button type="submit" className="password-submit" disabled={isChangingPassword}>
                        {isChangingPassword ? "Меняем..." : "Сменить пароль"}
                    </button>
                </form>
            )}

            {showData && (
                <div className="security-data">
                    {isLoading ? (
                        <p>Загрузка данных...</p>
                    ) : (
                        <>
                            <h3>Личные данные</h3>
                            <p>Имя: {userData?.name || "Не указано"}</p>
                            <p>Email: {userData?.email || "Не указан"}</p>
                            <p>Возраст: {userData?.age || "Не указан"}</p>

                            <h3>Обучение</h3>
                            <p>Цель: {learningData?.goal || "Не указана"}</p>
                            <p>Направление: {learningData?.direction || "Не указано"}</p>

                            <h3>Прогресс тренировок</h3>
                            <p>Всего ответов: {trainingData?.totalAnswers ?? 0}</p>
                            <p>Завершено заданий: {trainingData?.completedTasks ?? 0}</p>
                            <p>Средний результат: {trainingData?.averageScore ?? 0}%</p>
                        </>
                    )}

                    <button
                        type="button"
                        className="export-data-button"
                        onClick={handleExportData}
                        disabled={isLoading || !userData}
                    >
                        <Database size={17} />
                        Скачать мои данные
                    </button>
                </div>
            )}

            <div className="security-actions">
                <button type="button" className="logout-button" onClick={handleLogout}>
                    <LogOut size={17} />
                    Выйти из аккаунта
                </button>

                <button
                    type="button"
                    className="delete-account-button"
                    onClick={() => {
                        setShowDeleteModal(true);
                        setDeleteConfirmText("");
                        setDeleteError("");
                    }}
                >
                    <Trash2 size={17} />
                    Удалить аккаунт
                </button>
            </div>

            {showDeleteModal && (
                <div
                    className="delete-modal-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isDeleting) setShowDeleteModal(false);
                    }}
                >
                    <div
                        className="delete-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-modal-title"
                    >
                        <div className="delete-modal-header">
                            <AlertTriangle size={22} />
                            <button
                                type="button"
                                className="delete-modal-close"
                                aria-label="Закрыть"
                                onClick={() => !isDeleting && setShowDeleteModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <h3 id="delete-modal-title">Удалить аккаунт?</h3>
                        <p>
                            Аккаунт и все связанные с ним данные будут удалены безвозвратно:
                            профиль, история чатов, результаты тренировок и настройки.
                            Это действие нельзя отменить.
                        </p>

                        <label className="delete-confirm-label">
                            <span>Введи «УДАЛИТЬ» для подтверждения</span>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                autoComplete="off"
                                disabled={isDeleting}
                            />
                        </label>

                        {deleteError && <p className="password-message error" role="alert">{deleteError}</p>}

                        <div className="delete-modal-actions">
                            <button
                                type="button"
                                className="delete-cancel"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                Отмена
                            </button>

                            <button
                                type="button"
                                className="delete-confirm"
                                onClick={handleDeleteAccount}
                                disabled={isDeleting || deleteConfirmText !== "УДАЛИТЬ"}
                            >
                                {isDeleting ? "Удаляем..." : "Удалить аккаунт"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default SecuritySettings;
