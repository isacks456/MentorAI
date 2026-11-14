import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Moon, Sun, X } from "lucide-react";

import "./Header.css"

import { getProfile } from "../../api/api";

// Текущая тема может быть "system" (задана на странице настроек).
// В шапке переключаем только между явными "light" и "dark":
// системную трактуем по фактическому предпочтению ОС.
function isLightTheme(theme) {
    if (theme === "light") return true;

    if (theme === "system") {
        return window.matchMedia("(prefers-color-scheme: light)").matches;
    }

    return false;
}

function getInitials(profile) {
    if (!profile) return "";

    const source = profile.name && profile.name.trim() ? profile.name : profile.email;

    if (!source) return "";

    const parts = source.trim().split(/\s+/).slice(0, 2);

    return parts.map(part => part[0].toUpperCase()).join("");
}

function Header({ title, theme, setTheme, menuOpen, onMenuToggle }) {
	const navigate = useNavigate();

	const [profile, setProfile] = useState(null);

	// перезагружаем профиль при смене страницы, чтобы имя и аватар
	// отражали самые свежие данные после редактирования
	const location = useLocation();

	useEffect(() => {
		getProfile()
			.then(setProfile)
			.catch(() => {
				// профиль не загрузился — показываем пустой аватар без имени
			});
	}, [location.pathname]);

	const handleThemeToggle = () => {
		setTheme(isLightTheme(theme) ? "dark" : "light");
	};

	const light = isLightTheme(theme);

	const themeLabel = light ? "Тёмная тема" : "Светлая тема";

	const ThemeIcon = light ? Moon : Sun;

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

				<button
					className="header-button"
					aria-label={`Сменить тему (сейчас: ${light ? "светлая" : "тёмная"})`}
					title={`${themeLabel} — нажмите для переключения`}
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
