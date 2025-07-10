// config.ts
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    throw new Error("VITE_API_URL is not defined. Please create a .env file with your backend API URL.");
}

export { API_URL };
