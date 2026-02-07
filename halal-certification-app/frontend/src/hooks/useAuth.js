import { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8081';

export function useAuth() {
    const login = async (username, password) => {
        try {
            const response = await axios.post(`${API_BASE}/login`, {
                username,
                password,
            });
            return response.data;
        } catch (err) {
            throw new Error(err.response?.data?.error || 'Request failed');
        }
    };

    return { login };
}