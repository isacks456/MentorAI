import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { categories } from "../../data/knowledgeMaterials";

import "./KnowledgeSearch.css";

function KnowledgeSearch({
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    foundCount,
    onResetFilters
}) {
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    const hasFilters = Boolean(activeCategory) || Boolean(searchQuery);

    const handleReset = () => {
        onResetFilters();
        setIsFiltersOpen(false);
    };

    return (
        <section className="knowledge-search">
            <div className="search-input-wrapper">
                <Search size={20} />

                <input
                    type="text"
                    placeholder="Найти статью, тему или материал..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                />
            </div>

            <button
                type="button"
                className={`filter-button ${isFiltersOpen || activeCategory ? "active" : ""}`}
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                aria-expanded={isFiltersOpen}
            >
                <SlidersHorizontal size={18} />
                <span>Фильтры</span>
                {activeCategory && <span className="filter-badge">1</span>}
            </button>

            {isFiltersOpen && (
                <div className="filters-panel">
                    <div className="filters-panel-top">
                        <span>Фильтр по категории</span>
                        <button
                            type="button"
                            className="filters-close"
                            aria-label="Скрыть фильтры"
                            onClick={() => setIsFiltersOpen(false)}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="filters-chips">
                        {categories.map((category) => (
                            <button
                                key={category}
                                type="button"
                                className={`filter-chip ${activeCategory === category ? "active" : ""}`}
                                onClick={() =>
                                    setActiveCategory(
                                        activeCategory === category ? null : category
                                    )
                                }
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    <div className="filters-bottom">
                        <span className="filters-count">
                            Найдено материалов: {foundCount}
                        </span>

                        <button
                            type="button"
                            className="filters-reset"
                            onClick={handleReset}
                            disabled={!hasFilters}
                        >
                            Сбросить
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

export default KnowledgeSearch;
