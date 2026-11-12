import { BookOpen, Clock3, ArrowUpRight } from "lucide-react";

import "./FeaturedMaterials.css";

function FeaturedMaterials() {
    const materials = [
        {
            title: "Как составить резюме без опыта работы",
            description: "Разберись, как правильно представить свои навыки, учебные проекты и достижения.",
            category: "Первая работа",
            readTime: "5 минут"
        },
        {
            title: "Подготовка к техническому собеседованию",
            description: "Узнай, какие вопросы задают начинающим разработчикам и как на них отвечать.",
            category: "Первая работа",
            readTime: "8 минут"
        },
        {
            title: "Как выбрать направление обучения",
            description: "Разберись в образовательных направлениях и критериях выбора специальности.",
            category: "Поступление",
            readTime: "6 минут"
        }
    ];

    return (
        <section className="featured-materials">
            <div className="featured-heading">
                <div>
                    <h3>Популярные материалы</h3>
                    <p>Полезное для твоего развития</p>
                </div>
            </div>

            <div className="featured-grid">
                {materials.map((item, index) => {
                    return (
                        <article className="featured-card" key={index}>
                            <div className="featured-card-top">
                                <div className="featured-icon">
                                    <BookOpen size={21} />
                                </div>

                                <span className="featured-category">
                                    {item.category}
                                </span>
                            </div>

                            <h4>{item.title}</h4>

                            <p className="featured-description">
                                {item.description}
                            </p>

                            <div className="featured-card-footer">
                                <span>
                                    <Clock3 size={15} />
                                    {item.readTime}
                                </span>

                                <button type="button" aria-label="Открыть материал">
                                    <ArrowUpRight size={18} />
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

export default FeaturedMaterials;