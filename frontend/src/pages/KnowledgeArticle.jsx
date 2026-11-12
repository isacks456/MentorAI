import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock3 } from "lucide-react";

import materials from "../data/knowledgeMaterials";

import "./KnowledgeArticle.css";

function KnowledgeArticle() {
    const { id } = useParams();
    const navigate = useNavigate();

    const article = materials.find(item => item.id === Number(id));

    if (!article) {
        return (
            <section className="knowledge-article">
                <button
                    type="button"
                    onClick={() => navigate("/knowledge")}
                >
                    <ArrowLeft size={18} />
                    Назад к материалам
                </button>

                <h2>Материал не найден</h2>
                <p>Возможно, такой статьи не существует.</p>
            </section>
        );
    }

    return (
        <section className="knowledge-article">
            <button
                type="button"
                className="article-back"
                onClick={() => navigate("/knowledge")}
            >
                <ArrowLeft size={18} />
                Назад к материалам
            </button>

            <div className="article-header">
                <span className="article-category">
                    {article.category}
                </span>

                <h2>{article.title}</h2>

                <p>{article.description}</p>

                <span className="article-time">
                    <Clock3 size={16} />
                    {article.readTime}
                </span>
            </div>

            <div className="article-content">
                {article.content}
            </div>
        </section>
    );
}

export default KnowledgeArticle;
