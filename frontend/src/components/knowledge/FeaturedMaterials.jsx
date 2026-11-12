import { useNavigate } from "react-router-dom";
import { BookOpen, Clock3, ArrowUpRight } from "lucide-react";

import materials from "../../data/knowledgeMaterials";

import "./FeaturedMaterials.css";

// популярное: по одному материалу на каждую категорию
const FEATURED_IDS = [1, 2, 4];

function FeaturedMaterials() {
    const navigate = useNavigate();

    const featuredMaterials = FEATURED_IDS
        .map(id => materials.find(item => item.id === id))
        .filter(Boolean);

    if (featuredMaterials.length === 0) {
        return null;
    }

    return (
        <section className="featured-materials">
            <div className="featured-heading">
                <div>
                    <h3>Популярные материалы</h3>
                    <p>Полезное для твоего развития</p>
                </div>
            </div>

            <div className="featured-grid">
                {featuredMaterials.map((item) => {
                    return (
                        <article className="featured-card" key={item.id}>
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

                                <button
                                    type="button"
                                    aria-label={`Открыть материал: ${item.title}`}
                                    onClick={() => navigate(`/knowledge/${item.id}`)}
                                >
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
