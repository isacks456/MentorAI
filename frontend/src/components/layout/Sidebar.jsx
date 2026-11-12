import { NavLink } from "react-router-dom";

import {
    House,
    MessageCircle,
    Dumbbell,
    ChartNoAxesCombined,
    BookOpen,
	UserRound,
	Settings
} from "lucide-react";

import "./Sidebar.css"

function Sidebar() {

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

	return (
		<aside className="sidebar">
			<div className="sidebar-logo">
				<h2>MentorAI</h2>
			</div>

			<nav className="sidebar-nav">

				<p className="sidebar-heading">Основное меню</p>

				{menuItems.map((item) => {
					const Icon = item.icon;

					return (
						<NavLink
						key={item.path}
						to={item.path}
						className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}` 
						}
						data-path={item.path}
						>
							<Icon size={20}/>
							<span>{item.title}</span>
						</NavLink>
					);
				})}
				<p className="sidebar-heading">Аккаунт</p>

				{accountItems.map((item) => {
					const Icon = item.icon;
					return (
						<NavLink
						key={item.path}
						to={item.path}
						className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}` 
						}
						data-path={item.path}
						>
							<Icon size={20}/>
							<span>{item.title}</span>
						</NavLink>
					);
				})}
				
			</nav>

		</aside>
	);
}


export default Sidebar;