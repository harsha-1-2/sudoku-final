import axios from "axios";

// 👇 CHANGE: Use the Environment Variable, fall back to localhost only if missing
const baseURL = (process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api";

const axiosClient = axios.create({
  baseURL: baseURL,
  withCredentials: true, // Important for cookies/sessions if you use them
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosClient;
