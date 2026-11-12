const API_URL = "http://localhost:5056";

export async function checkBackend() {
	const response = await fetch(`${API_URL}/api/health`);

	if(!response.ok) {
		throw new Error("Ошибка при обращении к backend");
	}

	const data = await response.json();

	return data;
}

export async function sendMessage(message, chatSessionId) {
    const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: message,
            chatSessionId: chatSessionId
        })
    });

    if (!response.ok) {
        throw new Error("Не удалось отправить сообщение");
    }

    return await response.json();
}

export async function getChatHistory() {
	const response = await fetch(`${API_URL}/api/chat/history`);

	if(!response.ok) {
		throw new Error("Не удалось загрузить историю сообщений");
	}

	const data = await response.json();

	return data;
}

export async function createChatSession() {
    const response = await fetch(`${API_URL}/api/chat/sessions`, {
        method: "POST"
    });

    if (!response.ok) {
        throw new Error("Не удалось создать диалог");
    }

    return await response.json();
}

export async function getChatSessions() {
    const response = await fetch(`${API_URL}/api/chat/sessions`);

    if (!response.ok) {
        throw new Error("Не удалось получить список диалогов");
    }

    return await response.json();
}

export async function getChatMessages(sessionId) {
    const response = await fetch(
        `${API_URL}/api/chat/sessions/${sessionId}/messages`
    );

    if (!response.ok) {
        throw new Error("Не удалось загрузить сообщения");
    }

    return await response.json();
}

export async function getTrainingScenarios() {
    const response = await fetch(`${API_URL}/api/training/scenarios`);

    if (!response.ok) {
        throw new Error("Не удалось загрузить сценарии");
    }

    return await response.json();
}

export async function getScenarioTasks(scenarioId) {
    const response = await fetch(
        `${API_URL}/api/training/scenarios/${scenarioId}/tasks`
    );

    if (!response.ok) {
        throw new Error("Не удалось загрузить задания");
    }

    return await response.json();
}

export async function submitTrainingAnswer(trainingTaskId, answer) {
    const response = await fetch(`${API_URL}/api/Training/answer`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            trainingTaskId,
            answer
        })
    });

    if (!response.ok) {
        throw new Error("Не удалось отправить ответ");
    }

    return await response.json();
}

export async function getTrainingAnswers(taskId) {
    const response = await fetch(
        `${API_URL}/api/Training/tasks/${taskId}/answers`
    );

    if (!response.ok) {
        throw new Error("Не удалось загрузить историю ответов");
    }

    return await response.json();
}

export async function getTrainingProgress() {
    const response = await fetch(`${API_URL}/api/Training/progress`);

    if(!response.ok) {
        throw new Error("Не удалось загрузить статистику");
    }

    return await response.json();
}

export async function getTrainingResults() {
    const response = await fetch(`${API_URL}/api/Training/results`);

    if (!response.ok) {
        throw new Error("Не удалось загрузить результаты");
    }

    return await response.json();
}

export async function getTrainingSkills() {
    const response = await fetch(`${API_URL}/api/Training/skills`);

    if (!response.ok) {
        throw new Error("Не удалось загрузить прогресс навыков");
    }

    return await response.json();
}


export async function getProfile() {
    const token = sessionStorage.getItem("mentorai-token");

    const response = await fetch(`${API_URL}/api/Profile`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Не удалось загрузить профиль");
    }

    return await response.json();
}


export async function saveProfile(profile) {
    const response = await fetch(`${API_URL}/api/Profile`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("mentorai-token")}`
        },
        body: JSON.stringify({
            ...profile,
            age: Number(profile.age)
        })
    });

    if (!response.ok) {
        throw new Error("Не удалось сохранить профиль");
    }

    return await response.json();
}

export async function getLearningProfile() {
   const response = await fetch(`${API_URL}/api/LearningProfile`, {
    headers: {
        Authorization: `Bearer ${sessionStorage.getItem("mentorai-token")}`
    }
   });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error("Не удалось загрузить информацию об обучении");
    }

    return response.json();
}

export async function saveLearningProfile(profile) {
    const response = await fetch(`${API_URL}/api/LearningProfile`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("mentorai-token")}`
        },
        body: JSON.stringify(profile)
    });

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `Ошибка ${response.status}: ${errorText}`
        );
    }

    return response.json();
}