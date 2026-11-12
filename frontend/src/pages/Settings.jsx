import SettingsHeader from "../components/settings/SettingsHeader";
import AccountSettings from "../components/settings/AccountSettings";
import NotificationSettings from "../components/settings/NotificationSettings";
import AppearanceSettings from "../components/settings/AppearanceSettings";
import SecuritySettings from "../components/settings/SecuritySettings";

import "./Settings.css";

function Settings({ theme, setTheme }) {
	return (
		<div className="settings-page">
			<SettingsHeader/>

			<AccountSettings/>

			<NotificationSettings/>

			 <AppearanceSettings
                theme={theme}
                setTheme={setTheme}
            />

			<SecuritySettings/>
		</div>
	);
}

export default Settings;