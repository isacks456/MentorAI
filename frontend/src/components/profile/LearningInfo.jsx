import { Target, Code2, BriefcaseBusiness, BookOpen, Pencil, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { getLearningProfile, saveLearningProfile } from "../../api/api";

import "./LearningInfo.css";                                                    
                                                
function LearningInfo() {

    const initialProfile = {
        goal: "Найти первую стажировку",
        direction: "Frontend-разработка",
        position: "Junior Frontend Developer",
        description: "Подготовиться к трудоустройству и получить практический опыт",
        directionDescription: "HTML, CSS, JavaScript и React",
        positionDescription: "Начало карьеры в веб-разработке"
    };

    const [profile, setProfile] = useState(initialProfile);
    const [savedProfile, setSavedProfile] = useState(initialProfile);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

        useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await getLearningProfile();

                if (data) {
                    setProfile(data);
                    setSavedProfile(data);
                }
            } catch (error) {
                console.error("Ошибка загрузки информации об обучении:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, []);

        const handleChange = (event) => {
        const { name, value } = event.target;

        setProfile({
            ...profile,
            [name]: value
        });
    };

    const handleCancel = () => {
        setProfile({ ...savedProfile });
        setIsEditing(false);
    };

    const handleSave = async () => {
        try {
            const savedData = await saveLearningProfile(profile);

            setProfile(savedData);
            setSavedProfile(savedData);
            setIsEditing(false);
        } catch (error) {
            console.error("Ошибка сохранения информации об обучении:", error);
            alert("Не удалось сохранить информацию. Проверь работу backend.");
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };


        if (isLoading) {
        return (
            <section className="learning-info">
                <p>Загрузка информации об обучении...</p>
            </section>
        );
    }

    return (
        <section className="learning-info">
            <div className="learning-info-heading">
                <div>
                    <h3>Информация об обучении</h3>
                    <p>Твои образовательные цели и профессиональные интересы</p>
                </div>

                <div className="learning-info-actions">
                    {!isEditing ? (
                        <button onClick={handleEdit}>
                            <Pencil size={16} />
                            Редактировать
                        </button>
                    ) : (
                        <>
                            <button onClick={handleSave}>
                                <Check size={16} />
                                Сохранить
                            </button>

                            <button onClick={handleCancel}>
                                <X size={16} />
                                Отменить
                            </button>
                        </>
                    )}

                    <BookOpen size={22} />
                </div>
            </div>

            <div className="learning-info-grid">
                <div className="learning-info-card">
                    <div className="learning-info-icon">
                        <Target size={20} />
                    </div>
                    <span>Основная цель</span>
                    {isEditing ? (
                        <>
                            <input
                                type="text"
                                name="goal"
                                value={profile.goal}
                                onChange={handleChange}
                                placeholder="Основная цель"
                            />

                            <textarea
                                name="description"
                                value={profile.description}
                                onChange={handleChange}
                                placeholder="Описание цели"
                            />
                        </>
                    ) : (
                        <>
                            <h4>{profile.goal}</h4>
                            <p>{profile.description}</p>
                        </>
                    )}
                </div>

                <div className="learning-info-card">
                    <div className="learning-info-icon">
                        <Code2 size={20} />
                    </div>
                    <span>Интересующее направление</span>
                    {isEditing ? (
                        <>
                            <input
                                type="text"
                                name="direction"
                                value={profile.direction}
                                onChange={handleChange}
                                placeholder="Интересующее направление"
                            />

                            <textarea
                                name="directionDescription"
                                value={profile.directionDescription}
                                onChange={handleChange}
                                placeholder="Описание направления"
                            />
                        </>
                    ) : (
                        <>
                            <h4>{profile.direction}</h4>
                            <p>{profile.directionDescription}</p>
                        </>
                    )}
                </div>

                <div className="learning-info-card">
                    <div className="learning-info-icon">
                        <BriefcaseBusiness size={20} />
                    </div>
                    <span>Желаемая позиция</span>
                    {isEditing ? (
                        <>
                            <input
                                type="text"
                                name="position"
                                value={profile.position}
                                onChange={handleChange}
                                placeholder="Желаемая позиция"
                            />

                            <textarea
                                name="positionDescription"
                                value={profile.positionDescription}
                                onChange={handleChange}
                                placeholder="Описание позиции"
                            />
                        </>
                    ) : (
                        <>
                            <h4>{profile.position}</h4>
                            <p>{profile.positionDescription}</p>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}

export default LearningInfo;
