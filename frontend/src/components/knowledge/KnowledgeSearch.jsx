import { Search, SlidersHorizontal } from "lucide-react";

import "./KnowledgeSearch.css";

function KnowledgeSearch({ searchQuery, setSearchQuery }) {
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

            <button type="button" className="filter-button">
                <SlidersHorizontal size={18} />
                <span>Фильтры</span>
            </button>
        </section>
    );
}

export default KnowledgeSearch;