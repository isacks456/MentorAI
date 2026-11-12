import { useState } from "react";

import KnowledgeHeader from "../components/knowledge/KnowledgeHeader";
import KnowledgeSearch from "../components/knowledge/KnowledgeSearch";
import KnowledgeCategories from "../components/knowledge/KnowledgeCategories";
import FeaturedMaterials from "../components/knowledge/FeaturedMaterials";
import KnowledgeList from "../components/knowledge/KnowledgeList";

import "./Knowledge.css";

function Knowledge() {

    const [activeCategory, setActiveCategory] = useState(null);

    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="knowledge-page">
            <KnowledgeHeader />

            <KnowledgeSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
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