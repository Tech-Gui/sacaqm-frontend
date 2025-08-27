import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE;

axios.defaults.baseURL = API_BASE;

// Rehydrate Authorization header on page load/refresh
const token = localStorage.getItem("authToken");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// (Optional) handle 401 globally -> logout
axios.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      // window.location.href = "/login"; // uncomment if you want auto-redirect
    }
    return Promise.reject(err);
  }
);
