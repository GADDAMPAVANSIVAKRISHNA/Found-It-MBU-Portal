// frontend/src/utils/api.js

let API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
if (API_BASE_URL.endsWith("/api")) {
  API_BASE_URL = API_BASE_URL.slice(0, -4);
}

export const apiFetch = async (url, options = {}) => {
  try {
    // Ensure URL is absolute (prepend base if relative)
    const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

    // Priority 1: Get JWT token from localStorage (backend login)
    let token = localStorage.getItem("authToken");

    // Priority 2: Fallback to Firebase token if no JWT stored
    if (!token) {
      const firebaseUser = window.firebaseAuth?.currentUser;
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();
      }
    }

    const headers = {
      ...(options.headers || {}),
    };

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
