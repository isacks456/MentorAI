import { useState, useEffect } from "react";

import {
    Camera,
    Mail,
    CalendarDays,
    GraduationCap,
    MapPin,
    Pencil
} from "lucide-react";

import "./PersonalInfo.css";

import { getProfile, saveProfile } from "../../api/api";

const initialProfile = {
    name: "Максим Макаров",
    email: "example@mail.com",
    age: "18",
    course: "3 курс",
    institution: "Колледж"
};

function PersonalInfo() {
    const [isEditing, setIsEditing] = useState(false);

    const [savedProfile, setSavedProfile] = useState(initialProfile);

    const [profile, setProfile] = useState(initialProfile);

    const [errors, setErrors] = useState({});

        const handleChange = (event) => {
        const { name, value } = event.target;

        setProfile({
            ...profile,
            [name]: value
        });

        setErrors({
            ...errors,
            [name]: ""
        });
    };

    const validateProfile = () => {
    const newErrors = {};

    if (!profile.name.trim()) {
        newErrors.name = "Введите имя и фамилию";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
        newErrors.email = "Введите корректный адрес электронной почты";
    }

    const age = Number(profile.age);

    if (!Number.isInteger(age) || age < 1 || age > 120) {
        newErrors.age = "Возраст должен быть целым числом от 1 до 120";
    }

    if (!profile.course.trim()) {
        newErrors.course = "Укажите курс обучения";
    }

    if (!profile.institution.trim()) {
        newErrors.institution = "Укажите учебное заведение";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
};

    const handleSave = async () => {
    if (!validateProfile()) {
        return;
    }

    try {
        const savedData = await saveProfile(profile);

        setProfile(savedData);
        setSavedProfile(savedData);
        setIsEditing(false);

    } catch (error) {
        console.error("Ошибка сохранения профиля:", error);
        alert("Не удалось сохранить профиль. Проверь работу backend.");
    }
};

    const handleCancel = () => {
        setProfile({ ...savedProfile });
        setIsEditing(false);
    };

    useEffect(() => {
    const loadProfile = async () => {
        try {
            const data = await getProfile();

            if (data) {
                setProfile(data);
                setSavedProfile(data);
            }
        } catch (error) {
            console.error("Ошибка загрузки профиля:", error);
        }
    };

    loadProfile();
}, []);

    return (
        <section className="personal-info">
            <div className="personal-info-top">
                <h3>Личная информация</h3>

                <button
                    type="button"
                    className="edit-profile-button"
                    onClick={() => {
                        if (isEditing) {
                            handleCancel();
                        } else {
                            setIsEditing(true);
                        }
                    }}
                >
                    <Pencil size={16} />
                    {isEditing ? "Отменить" : "Редактировать"}
                </button>
            </div>

            <div className="personal-profile">
                <div className="profile-avatar">
                    <span>{profile.name.charAt(0).toUpperCase()}</span>

                    <button type="button" aria-label="Изменить аватар">
                        <Camera size={15} />
                    </button>
                </div>

                <div className="profile-user">
                    <h2>{profile.name}</h2>

                    <p>
                        Студент · Информационные системы и программирование
                    </p>

                    <span className="profile-role">
                        Участник MentorAI
                    </span>
                </div>
            </div>

            {isEditing ? (
                <>
                    <div className="profile-edit-form">
                        <label className="profile-field">
                            Имя и фамилия

                            <input
                                type="text"
                                name="name"
                                value={profile.name}
                                onChange={handleChange}
                                className={errors.name ? "input-error" : ""}
                            />

                            {errors.name && (
                                <span className="field-error">{errors.name}</span>
                            )}
                        </label>

                       <label className="profile-field">
                            Электронная почта

                            <input
                                type="email"
                                name="email"
                                value={profile.email}
                                onChange={handleChange}
                                className={errors.email ? "input-error" : ""}
                            />

                            {errors.email && (
                                <span className="field-error">{errors.email}</span>
                            )}
                        </label>

                        <label className="profile-field">
                            Возраст

                            <input
                                type="number"
                                name="age"
                                value={profile.age}
                                onChange={handleChange}
                                className={errors.age ? "input-error" : ""}
                            />

                            {errors.age && (
                                <span className="field-error">{errors.age}</span>
                            )}
                        </label>

                        <label className="profile-field">
                            Курс обучения

                            <input
                                type="text"
                                name="course"
                                value={profile.course}
                                onChange={handleChange}
                                className={errors.course ? "input-error" : ""}
                            />

                            {errors.course && (
                                <span className="field-error">{errors.course}</span>
                            )}
                        </label>

                        <label className="profile-field">
                            Учебное заведение

                            <input
                                type="text"
                                name="institution"
                                value={profile.institution}
                                onChange={handleChange}
                                className={errors.institution ? "input-error" : ""}
                            />

                            {errors.institution && (
                                <span className="field-error">{errors.institution}</span>
                            )}
                        </label>
                    </div>

                    <div className="profile-edit-actions">
                        <button
                            type="button"
                            className="save-profile-button"
                            onClick={handleSave}
                        >
                            Сохранить
                        </button>

                        <button
                            type="button"
                            className="cancel-profile-button"
                            onClick={handleCancel}
                        >
                            Отменить
                        </button>
                    </div>
                </>
            ) : (
                <div className="personal-details">
                    <div className="personal-detail">
                        <Mail size={18} />
                        <div>
                            <span>Электронная почта</span>
                            <p>{profile.email}</p>
                        </div>
                    </div>

                    <div className="personal-detail">
                        <CalendarDays size={18} />
                        <div>
                            <span>Возраст</span>
                            <p>{profile.age} лет</p>
                        </div>
                    </div>

                    <div className="personal-detail">
                        <GraduationCap size={18} />
                        <div>
                            <span>Курс обучения</span>
                            <p>{profile.course}</p>
                        </div>
                    </div>

                    <div className="personal-detail">
                        <MapPin size={18} />
                        <div>
                            <span>Учебное заведение</span>
                            <p>{profile.institution}</p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default PersonalInfo;
