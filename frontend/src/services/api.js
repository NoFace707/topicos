const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function getCookie(name) {
  const item = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.split("=").slice(1).join("=")) : null;
}

let csrfPromise = null;

export async function ensureCsrfCookie() {
  if (getCookie("csrftoken")) return;
  if (!csrfPromise) {
    csrfPromise = fetch(`${API_BASE_URL}/api/auth/csrf/`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    }).finally(() => {
      csrfPromise = null;
    });
  }
  const response = await csrfPromise;
  if (!response.ok) throw new Error("No se pudo preparar la sesión segura.");
}

/**
 * Cliente básico para interactuar con la API de Django
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health/`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/json",
      },
    });

    const data = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message || "No se pudo contactar al servidor",
    };
  }
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const method = (options.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    await ensureCsrfCookie();
  }

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...options.headers,
  };

  const body =
    options.body && typeof options.body !== "string"
      ? JSON.stringify(options.body)
      : options.body;

  const csrfToken = getCookie("csrftoken");
  if (csrfToken && !["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers["X-CSRFToken"] = csrfToken;
  }

  const config = {
    ...options,
    method,
    headers,
    body,
    credentials: "include",
  };

  const response = await fetch(url, config);
  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const firstFieldError = data && typeof data === "object"
      ? Object.values(data).flat().find((value) => typeof value === "string")
      : null;
    const error = new Error(data?.detail || data?.message || firstFieldError || `HTTP error ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export { API_BASE_URL };
