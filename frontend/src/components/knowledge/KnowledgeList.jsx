import { useNavigate } from "react-router-dom";

import materials from "../../data/knowledgeMaterials";

import { FileText, Clock3, ArrowRight } from "lucide-react";

import "./KnowledgeList.css";

function KnowledgeList({ activeCategory, searchQuery }) {

    const navigate = useNavigate();

    const filteredMaterials = materials.filter(item => {
    const matchesCategory = activeCategory
        ? item.category === activeCategory
        : true;

    const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    return (
        <section className="knowledge-list">
            <div className="knowledge-list-heading">
                <div>
                    <h3>Все материалы</h3>
                    <p>Изучай полезные статьи и инструкции</p>
                </div>

                <span>{filteredMaterials.length} материалов</span>
            </div>

            <div className="materials-list">
                {filteredMaterials.length === 0 && (
                    <p className="no-materials">
                        Материалы не найдены. Попробуй изменить поисковый запрос.
                    </p>
                )}
                {filteredMaterials.map((item, index) => {
                    return (
                        <article className="material-item" key={item.id}>
                            <div className="material-icon">
                                <FileText size={21} />
                            </div>

                            <div className="material-info">
                                <span className="material-category">
                                    {item.category}
                                </span>

                                <h4>{item.title}</h4>

                                <p>{item.description}</p>

                                <span className="material-time">
                                    <Clock3 size={14} />
                                    {item.readTime}
                                </span>
                            </div>

                            <button
                                type="button"
                                className="material-open"
                                aria-label="Открыть материал"
                                onClick={() => navigate(`/knowledge/${item.id}`)}
                            >
                                <ArrowRight size={19} />
                            </button>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

export default KnowledgeList;