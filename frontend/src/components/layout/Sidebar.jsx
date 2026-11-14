import { NavLink } from "react-router-dom";

import {
    House,
    MessageCircle,
    Dumbbell,
    ChartNoAxesCombined,
    BookOpen,
	UserRound,
	Settings,
    Megaphone
} from "lucide-react";

import { useAdminAccess } from "../../context/AdminAccessContext";

import "./Sidebar.css"

function Sidebar({ variant, onNavigate }) {

	const { isAdmin } = useAdminAccess();

	const menuItems = [
		{
			title: "Главная",
			icon: House,
			path: "/"
		},
		{
			title: "AI-наставник",
			icon: MessageCircle,
			path: "/mentor"
		},
		{
			title: "Тренажёр",
			icon: Dumbbell,
			path: "/exercise"
		},
		{
			title: "Мой прогресс",
			icon: ChartNoAxesCombined,
			path: "/progress"
		},
		{
			title: "База знаний",
			icon: BookOpen,
			path: "/knowledge"
		}
	];

	// Пункт «Анонсы» показывается только администраторам.
	// Backend всё равно проверяет права на каждом запросе — это лишь UX.
	if (isAdmin) {
		menuItems.push({
			title: "Анонсы",
			icon: Megaphone,
			path: "/announcements"
		});
	}

	const accountItems = [
		{
			title: "Профиль",
			icon: UserRound,
			path: "/profile"
		},
		{
			title: "Настройки",
			icon: Settings,
			path: "/settings"
		}
	];

	const isDrawer = variant === "drawer";

	const renderItems = (items) =>
		items.map((item) => {
			const Icon = item.icon;

			return (
				<NavLink
				key={item.path}
				to={item.path}
				onClick={onNavigate}
				className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
				data-path={item.path}
				>
					<Icon size={20}/>
					<span>{item.title}</span>
				</NavLink>
			);
		});

	return (
		<aside
			className={`sidebar ${isDrawer ? "sidebar-drawer" : ""}`}
			aria-label="Основная навигация"
		>
			<div className="sidebar-logo">
				<h2>MentorAI</h2>
			</div>

			<nav className="sidebar-nav">

				<p className="sidebar-heading">Основное меню</p>

				{renderItems(menuItems)}

				<p className="sidebar-heading">Аккаунт</p>

				{renderItems(accountItems)}

			</nav>

		</aside>
	);
}


export default Sidebar;