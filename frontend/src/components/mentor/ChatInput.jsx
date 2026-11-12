import { Send, LoaderCircle } from "lucide-react";
import "./ChatInput.css";

function ChatInput({ message, setMessage, onSend, isSending }) {
    const handleKeyDown = (event) => {
        // Enter — отправить, Shift + Enter — перенос строки
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSend();
        }
    };

    return (
        <div className="chat-input">
            <textarea
                placeholder="Напиши сообщение AI-наставнику... (Enter — отправить, Shift + Enter — новая строка)"
                rows="1"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
            />

            <button
                aria-label="Отправить сообщение"
                onClick={onSend}
                disabled={!message.trim() || isSending}
            >
                {isSending ? (
                    <LoaderCircle size={19} className="send-spinner" />
                ) : (
                    <Send size={19} />
                )}
            </button>

            <p>AI может ошибаться. Проверяй важную информацию.</p>
        </div>
    );
}

export default ChatInput;
