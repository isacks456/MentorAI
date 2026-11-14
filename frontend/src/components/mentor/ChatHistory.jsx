import { Plus, MessageSquare, Trash2 } from "lucide-react";
import "./ChatHistory.css";

function ChatHistory({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat }) {
    return (
        <aside className="chat-history">
            <button className="new-chat" onClick={onNewChat}>
                <Plus size={18} />
                Новый чат
            </button>

            <div className="chat-history-heading">
                История чатов
            </div>

            {chats.length === 0 ? (
                <p className="chat-history-empty">
                    Пока нет чатов. Создай новый и начни диалог.
                </p>
            ) : (
                <div className="chat-list">
                    {chats.map((chat) => (
                        <div
                            className={`chat-history-item ${
                                activeChatId === chat.id ? "active" : ""
                            }`}
                            key={chat.id}
                            onClick={() => onSelectChat(chat.id)}
                        >
                            <MessageSquare size={17} className="chat-item-icon" />
                            <span className="chat-item-title" title={chat.title}>
                                {chat.title}
                            </span>

                            <button
                                type="button"
                                className="chat-delete"
                                aria-label={`Удалить чат «${chat.title}»`}
                                title="Удалить чат"
                                onClick={(event) => {
                                    // не переключаем чат при клике на удаление
                                    event.stopPropagation();
                                    onDeleteChat(chat.id);
                                }}
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </aside>
    );
}

export default ChatHistory;
