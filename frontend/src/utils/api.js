// frontend/src/utils/api.js

// Fix: safely load Vercel OR localhost API URL
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  "http://localhost:5001";

console.log("API Base URL =", API_BASE);

export const apiFetch = async (url, options = {}) => {
  try {
    const fullUrl = url.startsWith("http")
      ? url
      : `${API_BASE}${url}`;

    let token = localStorage.getItem("authToken");

    if (!token && window.firebaseAuth?.currentUser) {
      token = await window.firebaseAuth.currentUser.getIdToken();
    }

    const headers = { ...(options.headers || {}) };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    console.error("apiFetch Error:", err);
    return { ok: false, status: 500, data: { message: "Network error" } };
  }
};
