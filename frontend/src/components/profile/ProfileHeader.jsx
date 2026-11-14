import { UserRound } from "lucide-react";
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
        </section>
    );
}

export default ProfileHeader;
