import ProfileHeader from "../components/profile/ProfileHeader";
import PersonalInfo from "../components/profile/PersonalInfo";
import LearningInfo from "../components/profile/LearningInfo";
import ProfileProgress from "../components/profile/ProfileProgress";


import "./Profile.css";

function Profile() {
	return (
		<div className="profile-page">
			<ProfileHeader />

            <PersonalInfo />

            <LearningInfo />

            <ProfileProgress />
		</div>
	);
}

export default Profile;