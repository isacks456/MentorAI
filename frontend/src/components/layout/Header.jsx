import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, Monitor } from "lucide-react";

import "./Header.css"

import { getProfile } from "../../api/api";

const THEME_ICONS = {
    dark: Moon,
    light: Sun,
    system: Monitor
};

const THEME_LABELS = {
    dark: "Тёмная тема",
    light: "Светлая тема",
    system: "Системная тема"
};

const NEXT_THEME = {
    dark: "light",
    light: "system",
    system: "dark"
};

function getInitials(profile) {
    if (!profile) return "";

    const source = profile.name && profile.name.trim() ? profile.name : profile.email;

    if (!source) return "";

    const parts = source.trim().split(/\s+/).slice(0, 2);

    return parts.map(part => part[0].toUpperCase()).join("");
}

function Header({ title, theme, setTheme }) {
	const navigate = useNavigate();

	const [query, setQuery] = useState("");
	const [profile, setProfile] = useState(null);

	useEffect(() => {
		getProfile()
			.then(setProfile)
			.catch(() => {
				// профиль не загрузился — показываем пустой аватар без имени
			});
	}, []);

	const handleSearchSubmit = (event) => {
		event.preventDefault();

		const trimmed = query.trim();

		if (!trimmed) return;

		navigate(`/knowledge?q=${encodeURIComponent(trimmed)}`);
		setQuery("");
	};

	const handleThemeToggle = () => {
		setTheme(NEXT_THEME[theme] || "dark");
	};

	const ThemeIcon = THEME_ICONS[theme] || Moon;

	const initials = getInitials(profile);

	return (
		<header className="header">
			<div className="header-left">
				<h1>{title}</h1>
			</div>

			<div className="header-right">

				<form className="search" onSubmit={handleSearchSubmit}>
					<input
						type="text"
						placeholder="Поиск..."
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						aria-label="Поиск по базе знаний"
					/>
				</form>

				<button
					className="header-button"
					aria-label={`Сменить тему (сейчас: ${THEME_LABELS[theme] || THEME_LABELS.dark})`}
					title={`${THEME_LABELS[theme] || THEME_LABELS.dark} — нажмите для переключения`}
					onClick={handleThemeToggle}
				>
					<ThemeIcon size={20} />
				</button>

				<div
					className="user-avatar"
					title="Профиль"
					onClick={() => navigate("/profile")}
				>
					{initials || "M"}
				</div>

			</div>

		</header>
	)
}

export default Header;
