const API_URL = "http://localhost:5056";

export async function registerUser(email, password) {
	const response = await fetch(`${API_URL}/api/auth/register`, {
		method: "POST",
		headers: {
		"Content-Type": "application/json"
		},
		body: JSON.stringify({
		email,
		password
	})
});
if (!response.ok) {
    const error = await response.json();
    throw new Error(
        error.errors
            ? Object.values(error.errors).flat().join("\n")
            : "Ошибка регистрации"
    );
}

	return true;
}

export async function loginUser(email, password)
	{
		const response = await fetch(
		`${API_URL}/api/auth/login?useCookies=false`,
	{
		method: "POST",
		headers: {
		"Content-Type": "application/json"
	},
		body: JSON.stringify({
		email,
		password,
		twoFactorCode: "",
		twoFactorRecoveryCode: ""
	})
	}
	);
	if (!response.ok) {
		throw new Error("Неверная почта или пароль");
	}

	const data = await response.json();

	sessionStorage.setItem("mentorai-token", data.accessToken);

	return data;
}