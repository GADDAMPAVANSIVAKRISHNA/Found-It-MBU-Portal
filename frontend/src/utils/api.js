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

let API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

if (API_BASE_URL.endsWith("/")) {
  API_BASE_URL = API_BASE_URL.slice(0, -1);
}

export const apiFetch = async (url, options = {}) => {
  try {
    const fullUrl = url.startsWith("http")
      ? url
      : `${API_BASE_URL}${url}`;

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

    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: "include",
    });

    const data = await response.json().catch(() => ({}));

    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    console.error("apiFetch Error:", err);
    return { ok: false, status: 500, data: { message: "Network error" } };
  }
};
