import { useState, useEffect } from "react";

import ChatHistory from "../components/mentor/ChatHistory";
import ChatWindow from "../components/mentor/ChatWindow";
import ChatInput from "../components/mentor/ChatInput";

import {
    sendMessage,
	createChatSession,
    getChatSessions,
    getChatMessages
} from "../api/api";

import "./Mentor.css";

function Mentor() {
    const [message, setMessage] = useState("");

    const [messages, setMessages] = useState([
        {
            role: "ai",
            text: "Привет! Я твой AI-наставник. Помогу подготовиться к поступлению, первой работе и адаптации в команде. С чего начнём?"
        }
    ]);

	const [sessions, setSessions] = useState([]);

	const [activeSessionId, setActiveSessionId] = useState(null);

	useEffect(() => {
    async function loadSessions() {
        try {
            const data = await getChatSessions();

            setSessions(data);

            if (data.length > 0) {
				const firstSession = data[0];

				setActiveSessionId(firstSession.id);

				const messagesData = await getChatMessages(firstSession.id);

				setMessages(messagesData);
			} else {
				const newSession = await createChatSession();

				setSessions([newSession]);
				setActiveSessionId(newSession.id);
				setMessages([]);
			}
        } catch (error) {
            console.error("Ошибка загрузки диалогов:", error);
        }
    }

    loadSessions();
}, []);

	async function handleNewChat() {
		try {
			const newSession = await createChatSession();

			setSessions((previousSessions) => [
				newSession,
				...previousSessions
			]);

			setActiveSessionId(newSession.id);
			setMessages([]);
		} catch (error) {
			console.error("Ошибка создания диалога:", error);
		}
}

	async function handleSelectChat(sessionId) {
		try {
			setActiveSessionId(sessionId);

			const data = await getChatMessages(sessionId);

			setMessages(data);
		} catch (error) {
			console.error("Ошибка загрузки диалога:", error);
		}
	}

    async function handleSend() {
        const text = message.trim();

        if (!text) return;

		if (!activeSessionId) return;

        setMessages((previousMessages) => [
            ...previousMessages,
            {
                role: "user",
                text: text
            }
        ]);

        setMessage("");

        try {
            const data = await sendMessage(text, activeSessionId);

            setMessages((previousMessages) => [
                ...previousMessages,
                {
                    role: "ai",
                    text: data.reply
                }
            ]);
        } catch (error) {
            setMessages((previousMessages) => [
                ...previousMessages,
                {
                    role: "ai",
                    text: "Не удалось связаться с сервером. Попробуй ещё раз."
                }
            ]);
        }
    }

    return (
        <div className="mentor-page">
            <ChatHistory
			chats={sessions}
			activeChatId={activeSessionId}
			onSelectChat={handleSelectChat}
			onNewChat={handleNewChat}
			/>

            <div className="mentor-main">
                <ChatWindow messages={messages} />

                <ChatInput
                    message={message}
                    setMessage={setMessage}
                    onSend={handleSend}
                />
            </div>
        </div>
    );
}

export default Mentor;