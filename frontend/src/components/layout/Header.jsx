import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Moon, Sun, Monitor, X } from "lucide-react";

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

function Header({ title, theme, setTheme, menuOpen, onMenuToggle }) {
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
				<button
					type="button"
					className="menu-button"
					aria-label={menuOpen ? "Закрыть меню навигации" : "Открыть меню навигации"}
					aria-expanded={menuOpen}
					aria-controls="mobile-drawer"
					title="Меню"
					onClick={onMenuToggle}
				>
					{menuOpen ? <X size={22} /> : <Menu size={22} />}
				</button>

				<h1>{title}</h1>
			</div>

			<div className="header-right">

				<form className="search" onSubmit={handleSearchSubmit} role="search">
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

				<button
					type="button"
					className="user-avatar"
					title="Профиль"
					aria-label="Профиль пользователя — перейти на страницу профиля"
					onClick={() => navigate("/profile")}
				>
					{initials || "M"}
				</button>

			</div>

		</header>
	)
}

export default Header;
