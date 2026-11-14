const API_URL = "http://localhost:5056";

function getAuthHeaders() {
    const token = sessionStorage.getItem("mentorai-token");

    if (!token) {
        return {};
    }

    return {
        Authorization: `Bearer ${token}`
    };
}

function handleAuthError(response) {
    if (response.status === 401) {
        sessionStorage.removeItem("mentorai-token");

        if (!window.location.pathname.startsWith("/login")) {
            window.location.assign("/login");
        }

        throw new Error("Сессия истекла. Войдите в аккаунт заново");
    }

    if (response.status === 403) {
        throw new Error("Доступ запрещён");
    }
}

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
            "Content-Type": "application/json",
            ...getAuthHeaders()
        },
        body: JSON.stringify({
            message: message,
            chatSessionId: chatSessionId
        })
    });

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось отправить сообщение");
    }

    return await response.json();
}

export async function createChatSession() {
    const response = await fetch(`${API_URL}/api/chat/sessions`, {
        method: "POST",
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось создать диалог");
    }

    return await response.json();
}

export async function getChatSessions() {
    const response = await fetch(`${API_URL}/api/chat/sessions`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось получить список диалогов");
    }

    return await response.json();
}

export async function getChatMessages(sessionId) {
    const response = await fetch(
        `${API_URL}/api/chat/sessions/${sessionId}/messages`, {
            headers: getAuthHeaders()
        }
    );

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось загрузить сообщения");
    }

    return await response.json();
}

export async function getTrainingScenarios() {
    const response = await fetch(`${API_URL}/api/training/scenarios`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось загрузить сценарии");
    }

    return await response.json();
}

export async function getScenarioTasks(scenarioId) {
    const response = await fetch(
        `${API_URL}/api/training/scenarios/${scenarioId}/tasks`, {
            headers: getAuthHeaders()
        }
    );

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось загрузить задания");
    }

    return await response.json();
}

export async function submitTrainingAnswer(trainingTaskId, answer) {
    const response = await fetch(`${API_URL}/api/Training/answer`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders()
        },
        body: JSON.stringify({
            trainingTaskId,
            answer
        })
    });

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось отправить ответ");
    }

    return await response.json();
}

export async function getTrainingAnswers(taskId) {
    const response = await fetch(
        `${API_URL}/api/Training/tasks/${taskId}/answers`,
        {
            headers: getAuthHeaders()
        }
    );

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось загрузить историю ответов");
    }

    return await response.json();
}

export async function getTrainingProgress() {
    const response = await fetch(`${API_URL}/api/Training/progress`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось загрузить статистику");
    }

    return await response.json();
}

export async function getTrainingResults() {
    const response = await fetch(`${API_URL}/api/Training/results`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось загрузить результаты");
    }

    return await response.json();
}

export async function getTrainingSkills() {
    const response = await fetch(`${API_URL}/api/Training/skills`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось загрузить прогресс навыков");
    }

    return await response.json();
}

export async function getTrainingSummary() {
    const response = await fetch(`${API_URL}/api/Training/summary`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось загрузить сводку активности");
    }

    return await response.json();
}

export async function getRecentActivity() {
    const response = await fetch(`${API_URL}/api/Training/activity`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось загрузить активность");
    }

    return await response.json();
}


export async function getProfile() {
    const response = await fetch(`${API_URL}/api/Profile`, {
        headers: getAuthHeaders()
    });

    if (response.status === 404) return null;

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось загрузить профиль");
    }

    return await response.json();
}


export async function saveProfile(profile) {
    const response = await fetch(`${API_URL}/api/Profile`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders()
        },
        body: JSON.stringify({
            ...profile,
            age: Number(profile.age)
        })
    });

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось сохранить профиль");
    }

    return await response.json();
}

export async function getLearningProfile() {
   const response = await fetch(`${API_URL}/api/LearningProfile`, {
    headers: getAuthHeaders()
   });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось загрузить информацию об обучении");
    }

    return response.json();
}

export async function saveLearningProfile(profile) {
    const response = await fetch(`${API_URL}/api/LearningProfile`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders()
        },
        body: JSON.stringify(profile)
    });

    if (!response.ok) {
        handleAuthError(response);

        const errorText = await response.text();

        throw new Error(
            `Ошибка ${response.status}: ${errorText}`
        );
    }

    return response.json();
}

// ---------- Настройки уведомлений (хранятся на сервере, у каждого пользователя свои) ----------

export async function getNotificationPreferences() {
    const response = await fetch(`${API_URL}/api/NotificationPreferences`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось загрузить настройки уведомлений");
    }

    return response.json();
}

export async function saveNotificationPreferences(prefs) {
    const response = await fetch(`${API_URL}/api/NotificationPreferences`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders()
        },
        body: JSON.stringify(prefs)
    });

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось сохранить настройки уведомлений");
    }

    return response.json();
}

// ---------- Аккаунт: смена пароля и удаление ----------

export async function changePassword(currentPassword, newPassword, confirmNewPassword) {
    const response = await fetch(`${API_URL}/api/Account/change-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders()
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword })
    });

    if (response.status === 401) {
        handleAuthError(response);
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.detail || "Не удалось сменить пароль");
    }

    return data;
}

export async function deleteAccount() {
    const response = await fetch(`${API_URL}/api/Account/delete`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });

    if (response.status === 401) {
        handleAuthError(response);
    }

    if (!response.ok) {
        throw new Error("Не удалось удалить аккаунт");
    }

    return response.json();
}

// ---------- Подтверждение электронной почты ----------

export async function getEmailStatus() {
    const response = await fetch(`${API_URL}/api/EmailVerification/status`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        handleAuthError(response);
        throw new Error("Не удалось получить статус почты");
    }

    return response.json();
}

export async function sendEmailCode() {
    const response = await fetch(`${API_URL}/api/EmailVerification/verification-code`, {
        method: "POST",
        headers: getAuthHeaders()
    });

    const data = await response.json().catch(() => null);

    if (response.status === 401) {
        handleAuthError(response);
    }

    if (!response.ok) {
        const err = new Error(data?.detail || "Не удалось отправить код");
        err.retryAfter = data?.detail ? (data.detail.match(/через (\d+)/) ? Number(data.detail.match(/через (\d+)/)[1]) : null) : null;
        throw err;
    }

    return data;
}

export async function verifyEmailCode(code) {
    const response = await fetch(`${API_URL}/api/EmailVerification/verify`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders()
        },
        body: JSON.stringify({ code })
    });

    const data = await response.json().catch(() => null);

    if (response.status === 401) {
        handleAuthError(response);
    }

    if (!response.ok) {
        throw new Error(data?.detail || "Не удалось подтвердить код");
    }

    return data;
}