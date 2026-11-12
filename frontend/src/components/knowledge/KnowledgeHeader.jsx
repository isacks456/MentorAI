import { BookOpen, Sparkles } from "lucide-react";

import "./KnowledgeHeader.css";

function KnowledgeHeader() {
    return (
        <section className="knowledge-header">
            <div className="knowledge-header-content">
                <div className="knowledge-title">
                    <BookOpen size={25} />

                    <div>
                        <h2>База знаний</h2>
                        <p>
                            Полезные материалы для обучения,
                            поступления и начала карьеры
                        </p>
                    </div>
                </div>

                <div className="knowledge-ai-label">
                    <Sparkles size={17} />
                    <span>Подобрано для твоего развития</span>
                </div>
            </div>
        </section>
    );
}

export default KnowledgeHeader;