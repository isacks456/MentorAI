import { UserRound, Settings } from "lucide-react";
import "./ProfileHeader.css";

function ProfileHeader() {
    return (
        <section className="profile-header">
            <div className="profile-header-info">
                <div className="profile-header-icon">
                    <UserRound size={24} />
                </div>

                <div>
                    <h2>Мой профиль</h2>
                    <p>Управляй личной информацией и отслеживай своё развитие</p>
                </div>
            </div>

            <button type="button" className="profile-settings-button">
                <Settings size={18} />
                <span>Настройки профиля</span>
            </button>
        </section>
    );
}

export default ProfileHeader;
