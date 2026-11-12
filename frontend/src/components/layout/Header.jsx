import "./Header.css"


function Header({ title }) {
	return (
		<header className="header">
			<div className="header-left">
				<h1>{title}</h1>
			</div>

			<div className="header-right">

				<div className="search">
					<input type="text" placeholder="Поиск..." />
				</div>

				<button className="header-button" aria-label="Уведомления">
					🔔
				</button>

				<button className="header-button" aria-label="Сменить тему">
					🌙
				</button>

				<div className="user-avatar">
					M
				</div>

			</div>

		</header>
	)
}





export default Header;