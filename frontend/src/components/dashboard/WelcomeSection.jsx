import "./WelcomeSection.css"

function WelcomeSection({ name }) {
	return (
		<section className="welcome-section">
			<div className="welcome-text">
				<h2>
					{name
						? `Добро пожаловать, ${name}!`
						: "Добро пожаловать!"}
				</h2>
				<p>
					Продолжим твой путь к профессиональному развитию?
                    Выбери направление и начни обучение.
				</p>
			</div>
		</section>
	);
}


export default WelcomeSection;
