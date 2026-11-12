
import { Plus, MessageSquare } from "lucide-react";
import "./ChatHistory.css";

function ChatHistory({ chats, activeChatId, onSelectChat, onNewChat }) {
    return (
        <aside className="chat-history">
            <button className="new-chat" onClick={onNewChat}>
                <Plus size={18} />
                Новый диалог
            </button>

            <div className="chat-history-heading">
                История диалогов
            </div>

            <div className="chat-list">
                {chats.map((chat) => (
                    <div
                        className={`chat-history-item ${
                            activeChatId === chat.id ? "active" : ""
                        }`}
                        key={chat.id}
                        onClick={() => onSelectChat(chat.id)}
                    >
                        <MessageSquare size={17} />
                        <span>{chat.title}</span>
                    </div>
                ))}
            </div>
        </aside>
    );
}

export default ChatHistory;
