import { Send } from "lucide-react";
import "./ChatInput.css";

function ChatInput({ message, setMessage, onSend }) {
    return (
        <div className="chat-input">
            <textarea
                placeholder="Напиши сообщение AI-наставнику..."
                rows="1"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
            />

            <button
                aria-label="Отправить сообщение"
                onClick={onSend}
                disabled={!message.trim()}
            >
                <Send size={19} />
            </button>

            <p>AI может ошибаться. Проверяй важную информацию.</p>
        </div>
    );
}

export default ChatInput;