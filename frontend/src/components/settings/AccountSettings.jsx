import { UserRound, Mail, LockKeyhole, Pencil, Lock } from "lucide-react";
import "./AccountSettings.css";

import { useEffect, useState } from "react";
import { getProfile, saveProfile } from "../../api/api";

function AccountSettings() {

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

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
                        <p>{isLoading ? "Загрузка..." : profile?.email || "Не указана"}</p>
                    </div>

                    {/* Email — постоянный идентификатор аккаунта, изменять его нельзя */}
                    <span className="account-setting-locked" aria-label="Электронная почта неизменяема">
                        <Lock size={16} />
                    </span>
                </div>

                <div className="account-setting-item">
                    <div className="account-setting-icon">
                        <LockKeyhole size={19} />
                    </div>

                    <div className="account-setting-info">
                        <span>Пароль</span>
                        <p>••••••••••••</p>
                    </div>

                    <span className="account-setting-locked" aria-label="Пароль меняется в разделе «Безопасность и конфиденциальность»">
                        <Lock size={16} />
                    </span>
                </div>
            </div>
        </section>
    );
}

export default AccountSettings;
