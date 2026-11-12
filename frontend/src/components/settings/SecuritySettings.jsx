import {
    ShieldCheck,
    Eye,
    Database,
    LogOut,
    Trash2,
    ChevronRight
} from "lucide-react";

import "./SecuritySettings.css";

import { useState } from "react";

import { useNavigate } from "react-router-dom";

import {
    getProfile,
    getLearningProfile,
    getTrainingProgress
} from "../../api/api";

function SecuritySettings() {

    const navigate = useNavigate();

    const [showData, setShowData] = useState(false);
    const [userData, setUserData] = useState(null);
    const [learningData, setLearningData] = useState(null);
    const [trainingData, setTrainingData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

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
                <button type="button" className="security-item">
                    <div className="security-item-icon">
                        <Eye size={19} />
                    </div>

                    <div className="security-item-info">
                        <h4>Конфиденциальность</h4>
                        <p>Управление доступом к личной информации</p>
                    </div>

                    <ChevronRight size={19} />
                </button>

                <button type="button" className="security-item">
                    <div className="security-item-icon">
                        <Database size={19} />
                    </div>

                    <div className="security-item-info" onClick={handleDataClick}>
                        <h4>Мои данные</h4>
                        <p>Информация, хранящаяся в MentorAI</p>
                    </div>

                    <ChevronRight size={19} />
                </button>
            </div>

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

                <button type="button" className="delete-account-button">
                    <Trash2 size={17} />
                    Удалить аккаунт
                </button>
            </div>
        </section>
    );
}

export default SecuritySettings;
