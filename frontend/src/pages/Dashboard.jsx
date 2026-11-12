import WelcomeSection from "../components/dashboard/WelcomeSection";
import Statistics from "../components/dashboard/Statistics";
import ScenarioCards from "../components/dashboard/ScenarioCards";
import RecentActivity from "../components/dashboard/RecentActivity";
import Recommendations from "../components/dashboard/Recommendations";

import "./Dashboard.css"

function Dashboard() {
	return (
		<div className="dashboard">
			
			<WelcomeSection name="Антон"/>

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