import { useState } from "react";

import {
    GraduationCap,
    Briefcase,
    Users
} from "lucide-react";

import "./KnowledgeCategories.css";

function KnowledgeCategories({ activeCategory, setActiveCategory }) {

    const categories = [
        {
            title: "Поступление",
            description: "Подготовка к поступлению и выбор учебного заведения",
            icon: GraduationCap
        },
        {
            title: "Первая работа",
            description: "Поиск стажировки, резюме и собеседования",
            icon: Briefcase
        },
        {
            title: "Адаптация",
            description: "Начало работы и взаимодействие с командой",
            icon: Users
        }
    ];

    return (
        <section className="knowledge-categories">
            <div className="categories-heading">
                <h3>Направления обучения</h3>
                <p>Выбери интересующую тебя тему</p>
            </div>

            <div className="categories-grid">
                {categories.map((item, index) => {
                    const Icon = item.icon;

                    return (
                        <button
                        className={`category-card ${activeCategory === item.title ? "active" : ""}`}
                        type="button"
                        key={index}
                        onClick={() => setActiveCategory(
                            activeCategory === item.title ? null : item.title
                        )}
                        >
                            <div className="category-icon">
                                <Icon size={23} />
                            </div>

                            <div className="category-info">
                                <h4>{item.title}</h4>
                                <p>{item.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

export default KnowledgeCategories;