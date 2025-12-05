// frontend/src/utils/api.js

// Read backend URL from Vercel env or fallback to localhost
let API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001";

// Remove trailing "/api" if accidentally added
if (API_BASE_URL.endsWith("/api")) {
  API_BASE_URL = API_BASE_URL.slice(0, -4);
}

export const apiFetch = async (url, options = {}) => {
  try {
    // Make relative URLs absolute
    const fullUrl = url.startsWith("http")
      ? url
      : `${API_BASE_URL}${url}`;

    // TOKEN HANDLING -------------------------------

    // 🔹 1. First try backend JWT (stored during login)
    let token = localStorage.getItem("authToken");

    // 🔹 2. If no JWT, fallback to Firebase token
    if (!token && window.firebaseAuth?.currentUser) {
      token = await window.firebaseAuth.currentUser.getIdToken();
    }

    // HEADERS SETUP ---------------------------------

    const headers = {
      ...(options.headers || {}),
    };

    // Auto-add JSON header unless uploading FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    // Add Authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // API REQUEST ------------------------------------

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    // Parse JSON safely
    const data = await response.json().catch(() => ({}));

    return {
      ok: response.ok,
      status: response.status,
      data,
    };

  } catch (err) {
    console.error("apiFetch Error:", err);
    return {
      ok: false,
      status: 500,
      data: { message: "Network error" },
    };
  }
};
