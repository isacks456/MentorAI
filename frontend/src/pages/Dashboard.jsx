import { useEffect, useState } from "react";

import WelcomeSection from "../components/dashboard/WelcomeSection";
import Statistics from "../components/dashboard/Statistics";
import ScenarioCards from "../components/dashboard/ScenarioCards";
import RecentActivity from "../components/dashboard/RecentActivity";
import Recommendations from "../components/dashboard/Recommendations";

import { getProfile } from "../api/api";

import "./Dashboard.css"

function Dashboard() {
	const [userName, setUserName] = useState(null);

	useEffect(() => {
		async function loadProfile() {
			try {
				const profile = await getProfile();

				if (profile?.name) {
					setUserName(profile.name);
				}
			} catch (error) {
				console.error("Ошибка загрузки профиля:", error);
			}
		}

		loadProfile();
	}, []);

	return (
		<div className="dashboard">

			<WelcomeSection name={userName} />

			<Statistics/>

			<ScenarioCards/>

			<div className="dashboard-bottom">
				<RecentActivity/>
				<Recommendations/>
			</div>

		</div>
	);
}

export default Dashboard;
