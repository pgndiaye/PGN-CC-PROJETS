import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const TOKEN = import.meta.env.VITE_API_TOKEN ?? '';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
  },
});
