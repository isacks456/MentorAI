import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import KnowledgeHeader from "../components/knowledge/KnowledgeHeader";
import KnowledgeSearch from "../components/knowledge/KnowledgeSearch";
import KnowledgeCategories from "../components/knowledge/KnowledgeCategories";
import FeaturedMaterials from "../components/knowledge/FeaturedMaterials";
import KnowledgeList from "../components/knowledge/KnowledgeList";

import "./Knowledge.css";

function Knowledge() {

    const [searchParams, setSearchParams] = useSearchParams();

    const queryParam = searchParams.get("q") || "";

    const [activeCategory, setActiveCategory] = useState(null);

    const [searchQuery, setSearchQuery] = useState(queryParam);

    // синхронизация с URL: поиск из Header приходит через /knowledge?q=...
    useEffect(() => {
        setSearchQuery(queryParam);
    }, [queryParam]);

    const handleSearchChange = (value) => {
        setSearchQuery(value);
        setSearchParams(value ? { q: value } : {}, { replace: true });
    };

    return (
        <div className="knowledge-page">
            <KnowledgeHeader />

            <KnowledgeSearch
                searchQuery={searchQuery}
                setSearchQuery={handleSearchChange}
            />

            <KnowledgeCategories
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
            />

            <FeaturedMaterials />

            <KnowledgeList
                activeCategory={activeCategory}
                searchQuery={searchQuery}
            />
        </div>
    );
}

export default Knowledge;
