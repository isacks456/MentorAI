import { UserRound, Mail, LockKeyhole, Pencil } from "lucide-react";
import "./AccountSettings.css";

import { useEffect, useState } from "react";
import { getProfile, saveProfile } from "../../api/api";

function AccountSettings() {

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [editedEmail, setEditedEmail] = useState("");

useEffect(() => {
    const loadProfile = async () => {
        try {
            const data = await getProfile();
            setProfile(data);
        } catch (error) {
            console.error("Ошибка загрузки профиля:", error);
        } finally {
            setIsLoading(false);
        }
    };

    loadProfile();
}, []);

const handleSaveName = async () => {
    if (!editedName.trim()) {
        alert("Имя не может быть пустым");
        return;
    }

    setIsSaving(true);

    try {
        const updatedProfile = await saveProfile({
            ...profile,
            name: editedName.trim()
        });

        setProfile(updatedProfile);
        setIsEditingName(false);
    } catch (error) {
        console.error("Ошибка сохранения имени:", error);
        alert("Не удалось сохранить имя");
    } finally {
        setIsSaving(false);
    }
};

const handleSaveEmail = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedEmail)) {
        alert("Введите корректную электронную почту");
        return;
    }

    setIsSaving(true);

    try {
        const updatedProfile = await saveProfile({
            ...profile,
            email: editedEmail.trim()
        });

        setProfile(updatedProfile);
        setIsEditingEmail(false);
    } catch (error) {
        console.error("Ошибка сохранения почты:", error);
        alert("Не удалось сохранить электронную почту");
    } finally {
        setIsSaving(false);
    }
};

    return (
        <section className="account-settings">
            <div className="account-settings-heading">
                <div>
                    <h3>Аккаунт</h3>
                    <p>Управление личными данными и доступом к аккаунту</p>
                </div>
                <UserRound size={22} />
            </div>

            <div className="account-settings-list">
                <div className="account-setting-item">
                    <div className="account-setting-icon">
                        <UserRound size={19} />
                    </div>

                    <div className="account-setting-info">
                        <span>Имя пользователя</span>

                        {isEditingName ? (
                            <input
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                placeholder="Введите имя"
                            />
                        ) : (
                            <p>{isLoading ? "Загрузка..." : profile?.name || "Не указано"}</p>
                        )}
                    </div>

                    <button
                        type="button"
                        aria-label="Изменить имя"
                        onClick={() => {
                            if (isEditingName) {
                                handleSaveName();
                            } else {
                                setEditedName(profile?.name || "");
                                setIsEditingName(true);
                            }
                        }}
                        disabled={isLoading || isSaving}
                    >
                        {isSaving ? "..." : isEditingName ? "Сохранить" : <Pencil size={17} />}
                    </button>
                    {isEditingName && (
                        <button
                            type="button"
                            className="cancel-edit-button"
                            onClick={() => {
                                setEditedName(profile?.name || "");
                                setIsEditingName(false);
                            }}
                            disabled={isSaving}
                        >
                            Отмена
                        </button>
                    )}
                </div>

                <div className="account-setting-item">
                    <div className="account-setting-icon">
                        <Mail size={19} />
                    </div>

                    <div className="account-setting-info">
                        <span>Электронная почта</span>

                        {isEditingEmail ? (
                            <input
                                type="email"
                                value={editedEmail}
                                onChange={(e) => setEditedEmail(e.target.value)}
                                placeholder="Введите email"
                            />
                        ) : (
                            <p>
                                {isLoading ? "Загрузка..." : profile?.email || "Не указана"}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        aria-label="Изменить почту"
                        onClick={() => {
                            if (isEditingEmail) {
                                handleSaveEmail();
                            } else {
                                setEditedEmail(profile?.email || "");
                                setIsEditingEmail(true);
                            }
                        }}
                        disabled={isLoading || isSaving}
                    >
                        {isSaving ? "..." : isEditingEmail ? "Сохранить" : <Pencil size={17} />}
                    </button>
                    {isEditingEmail && (
                        <button
                            type="button"
                            className="cancel-edit-button"
                            onClick={() => {
                                setEditedEmail(profile?.email || "");
                                setIsEditingEmail(false);
                            }}
                            disabled={isSaving}
                        >
                            Отмена
                        </button>
                    )}
                </div>

                <div className="account-setting-item">
                    <div className="account-setting-icon">
                        <LockKeyhole size={19} />
                    </div>

                    <div className="account-setting-info">
                        <span>Пароль</span>
                        <p>••••••••••••</p>
                    </div>

                    <button type="button" aria-label="Изменить пароль">
                        <Pencil size={17} />
                    </button>
                </div>
            </div>
        </section>
    );
}

export default AccountSettings;
