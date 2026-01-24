// // frontend/src/utils/api.js

// // Fix: safely load Vercel OR localhost API URL
// const API_BASE =
//   (typeof import.meta !== "undefined" &&
//     import.meta.env &&
//     import.meta.env.VITE_API_URL) ||
//   "http://localhost:5001";

// console.log("API Base URL =", API_BASE);

// export const apiFetch = async (url, options = {}) => {
//   try {
//     const fullUrl = url.startsWith("http")
//       ? url
//       : `${API_BASE}${url}`;

//     let token = localStorage.getItem("authToken");

//     if (!token && window.firebaseAuth?.currentUser) {
//       token = await window.firebaseAuth.currentUser.getIdToken();
//     }

//     const headers = { ...(options.headers || {}) };

//     if (!(options.body instanceof FormData)) {
//       headers["Content-Type"] = "application/json";
//     }

//     if (token) {
//       headers["Authorization"] = `Bearer ${token}`;
//     }

//     const response = await fetch(fullUrl, {
//       ...options,
//       headers,
//     });

//     const data = await response.json().catch(() => ({}));

//     return { ok: response.ok, status: response.status, data };
//   } catch (err) {
//     console.error("apiFetch Error:", err);
//     return { ok: false, status: 500, data: { message: "Network error" } };
//   }
// };


import { auth } from "../lib/firebase";

let API_BASE_URL = import.meta.env.NEXT_PUBLIC_BACKEND_URL || import.meta.env.VITE_API_URL || '';

// If no explicit backend URL is provided, but we're running the frontend locally, assume the backend is http://localhost:5001
// This prevents requests from accidentally going to the frontend dev server (which returns 404 / "Not found").
if (!API_BASE_URL) {
  if (typeof window !== "undefined" && /^https?:\/\/(localhost|127\.0\.0\.1)/.test(window.location.origin)) {
    API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  } else {
    API_BASE_URL = import.meta.env.NEXT_PUBLIC_BACKEND_URL || '';
  }
}

if (API_BASE_URL && API_BASE_URL.endsWith("/")) {
  API_BASE_URL = API_BASE_URL.slice(0, -1);
}

if (
  typeof window !== "undefined" &&
  window.location.protocol === "https:" &&
  API_BASE_URL.startsWith("http://")
) {
  API_BASE_URL = API_BASE_URL.replace("http://", "https://");
}

export const apiFetch = async (url, options = {}) => {
  try {
    const base = API_BASE_URL || (import.meta.env.NEXT_PUBLIC_BACKEND_URL || import.meta.env.VITE_API_URL || "");
    // Prevent double "/api/api" in production setups where base already includes /api
    let finalUrl = url;
    if (typeof base === 'string' && base.endsWith('/api') && url.startsWith('/api')) {
      finalUrl = url.replace(/^\/api/, '');
    }

    const fullUrl = url.startsWith("http")
      ? url
      : `${base}${finalUrl}`;

    let token = localStorage.getItem("authToken");

    // 🔥 REAL FIX — ALWAYS GET FRESH FIREBASE TOKEN
    if (auth.currentUser) {
      token = await auth.currentUser.getIdToken(true);
    }

    const headers = {
      ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.debug('[apiFetch] Request:', { fullUrl, options, headers });

    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: "include",
    });

    // Log not-found responses to help identify wrong origin or path
    if (response.status === 404) {
      console.warn(`[apiFetch] 404 Not Found: ${fullUrl}`);
    }

    const data = await response.json().catch(() => ({}));

    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    console.error("apiFetch Error:", err);
    return { ok: false, status: 500, data: { message: "Network error" } };
  }
};

export const BASE_URL = `${API_BASE_URL}/api`;
