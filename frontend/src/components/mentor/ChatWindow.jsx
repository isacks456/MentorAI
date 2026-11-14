import { useEffect, useRef } from "react";
import { Bot, User, AlertCircle } from "lucide-react";
import "./ChatWindow.css";

function ChatWindow({ messages }) {
    const messagesRef = useRef(null);

    // автопрокрутка к последнему сообщению
    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <section className="chat-window">
            <div className="chat-header">
                <div>
                    <h2>AI-наставник</h2>
                    <p>Твой персональный помощник в обучении</p>
                </div>

                <span className="ai-status">
                    <span className="status-dot"></span>
                    Онлайн
                </span>
            </div>

            <div className="chat-messages" ref={messagesRef}>
                {messages.length === 0 ? (
                    <div className="chat-empty">
                        <Bot size={30} />
                        <p>Начни диалог — напиши первое сообщение, и наставник ответит.</p>
                    </div>
                ) : (
                    messages.map((item, index) => (
                        <div
                            className={`message ${item.role}-message ${item.isError ? "error-message" : ""}`}
                            key={index}
                        >
                            <div className="message-avatar">
                                {item.role === "user" ? (
                                    <User size={20} />
                                ) : (
                                    <Bot size={20} />
                                )}
                            </div>

                            <div className="message-content">
                                <span>
                                    {item.role === "user" ? "Ты" : "AI-наставник"}
                                </span>

                                {item.isError && <AlertCircle size={15} className="error-icon" />}

                                <p>{item.text}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}

export default ChatWindow;
