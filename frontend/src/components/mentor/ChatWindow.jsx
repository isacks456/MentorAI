import { Bot, User } from "lucide-react";
import "./ChatWindow.css";

function ChatWindow({ messages }) {
    return (
        <section className="chat-window">
            <div className="chat-header">
                <div>
                    <h2>AI-наставник</h2>
                    <p>Твой персональный помощник в обучении</p>
                </div>

                <span className="ai-status">
                    <span className="status-bot"></span>
                    Онлайн
                </span>
            </div>

            <div className="chat-messages">
                {messages.map((item, index) => (
                    <div
                        className={`message ${item.role}-message`}
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

                            <p>{item.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default ChatWindow;