import React, { useState } from "react";
import { useAuthContext } from "../services/authContext";
import { useAuth } from "../hooks/useAuth";
import "../styles/LoginForm.css";

export default function LoginForm() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const { login } = useAuthContext();
    const { login: apiLogin } = useAuth();

	const handleLogin = async () => {
		try {
			const response = await apiLogin(username, password);
			login(response);
		} catch (err) {
			setError(err.message);
		}
	};

	return (
		<div className="form login">
			<h2>Login</h2>
			<input
				value={username}
				onChange={(e) => setUsername(e.target.value)}
				placeholder="Username"
			/>
			<input
				type="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				placeholder="Password"
			/>
			<button onClick={handleLogin}>Login</button>
			{error && <p style={{ color: "red" }}>{error}</p>}
		</div>
	);
}