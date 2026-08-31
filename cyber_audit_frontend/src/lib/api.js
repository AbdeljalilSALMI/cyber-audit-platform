const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function authedGet(path, accessToken) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new ApiError(
      "Impossible de contacter le serveur. Vérifiez votre connexion réseau.",
      0
    );
  }

  if (response.status === 401) {
    throw new ApiError("Session expirée. Reconnectez-vous.", 401);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail || (body ? Object.values(body).flat().join(" ") : null);
    throw new ApiError(detail || "Une erreur est survenue lors du chargement des données.", response.status);
  }
  return response.json();
}

export async function fetchAudits(accessToken) {
  const data = await authedGet("/api/audits/?page_size=200", accessToken);
  return data.results ?? data;
}

export async function fetchOrganizations(accessToken) {
  const data = await authedGet("/api/organizations/?page_size=200", accessToken);
  return data.results ?? data;
}

export async function fetchFrameworks(accessToken) {
  const data = await authedGet("/api/frameworks/?page_size=200", accessToken);
  return data.results ?? data;
}

export async function deleteOrganization(accessToken, id) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/organizations/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new ApiError("Impossible de contacter le serveur.", 0);
  }
  if (response.status === 401) throw new ApiError("Session expirée. Reconnectez-vous.", 401);
  if (!response.ok) throw new ApiError("Impossible de supprimer l'organisation.", response.status);
}

export async function createOrganization(accessToken, payload) {
  return authedPost("/api/organizations/", accessToken, payload);
}

export async function createAudit(accessToken, { organization, framework }) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/audits/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ organization, framework }),
    });
  } catch {
    throw new ApiError(
      "Impossible de contacter le serveur. Vérifiez votre connexion réseau.",
      0
    );
  }

  if (response.status === 401) {
    throw new ApiError("Session expirée. Reconnectez-vous.", 401);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body ? Object.values(body).flat().join(" ") : null;
    throw new ApiError(detail || "Impossible de créer l'audit.", response.status);
  }
  return response.json();
}

async function authedPost(path, accessToken, body) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Impossible de contacter le serveur.", 0);
  }
  if (response.status === 401) throw new ApiError("Session expirée. Reconnectez-vous.", 401);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const detail = data ? Object.values(data).flat().join(" ") : null;
    throw new ApiError(detail || "Une erreur est survenue.", response.status);
  }
  return response.json();
}

async function authedPatch(path, accessToken, body) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Impossible de contacter le serveur.", 0);
  }
  if (response.status === 401) throw new ApiError("Session expirée. Reconnectez-vous.", 401);
  if (!response.ok) throw new ApiError("Impossible d'enregistrer la modification.", response.status);
  return response.json();
}

export async function fetchAuditDetail(accessToken, auditId) {
  return authedGet(`/api/audits/${auditId}/`, accessToken);
}

export async function fetchFrameworkDetail(accessToken, frameworkId) {
  return authedGet(`/api/frameworks/${frameworkId}/`, accessToken);
}

export async function submitAnswer(accessToken, auditId, payload) {
  const isFormData = payload instanceof FormData;
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/audits/${auditId}/answers/`, {
      method: "POST",
      headers: isFormData
        ? { Authorization: `Bearer ${accessToken}` }
        : { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: isFormData ? payload : JSON.stringify(payload),
    });
  } catch {
    throw new ApiError("Impossible de contacter le serveur.", 0);
  }
  if (response.status === 401) throw new ApiError("Session expirée. Reconnectez-vous.", 401);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const detail = data ? Object.values(data).flat().join(" ") : null;
    throw new ApiError(detail || "Impossible d'enregistrer la réponse.", response.status);
  }
  return response.json();
}

export async function completeAudit(accessToken, auditId) {
  return authedPost(`/api/audits/${auditId}/complete/`, accessToken, {});
}

export async function fetchRisks(accessToken, auditId) {
  const data = await authedGet(`/api/risks/?audit=${auditId}`, accessToken);
  return data.results ?? data;
}

export async function fetchAllRecommendations(accessToken) {
  const data = await authedGet(`/api/recommendations/?page_size=200`, accessToken);
  return data.results ?? data;
}

export async function fetchAllActions(accessToken) {
  const data = await authedGet(`/api/action-plans/?page_size=200`, accessToken);
  return data.results ?? data;
}

export async function updateActionStatus(accessToken, actionId, status) {
  return authedPatch(`/api/action-plans/${actionId}/`, accessToken, { status });
}

export async function generateReport(accessToken, auditId) {
  return authedPost(`/api/reports/generate/`, accessToken, { audit: auditId });
}

export async function fetchNotifications(accessToken) {
  const data = await authedGet(`/api/notifications/`, accessToken);
  return data.results ?? data;
}

export async function markNotificationRead(accessToken, notificationId) {
  return authedPost(`/api/notifications/${notificationId}/mark_read/`, accessToken, {});
}

export async function markAllNotificationsRead(accessToken) {
  return authedPost(`/api/notifications/mark-all-read/`, accessToken, {});
}

export async function fetchDashboardOverview(accessToken) {
  return authedGet("/api/dashboard/overview/", accessToken);
}

export async function fetchDashboard(accessToken, organizationId) {
  const url = new URL(`${API_BASE_URL}/api/dashboard/`);
  if (organizationId) {
    url.searchParams.set("organization", organizationId);
  }

  let response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new ApiError(
      "Impossible de contacter le serveur. Vérifiez votre connexion réseau.",
      0
    );
  }

  if (response.status === 401) {
    throw new ApiError("Session expirée. Reconnectez-vous.", 401);
  }

  if (response.status === 404) {
    return null; // aucun audit trouvé pour l'instant
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail;
    throw new ApiError(
      detail || "Une erreur est survenue lors du chargement du tableau de bord.",
      response.status
    );
  }

  return response.json();
}

export async function fetchQuestions(accessToken) {
  const data = await authedGet("/api/questions/?page_size=200", accessToken);
  return data.results ?? data;
}

export async function fetchRiskTemplates(accessToken) {
  const data = await authedGet("/api/risks/templates/?page_size=200", accessToken);
  return data.results ?? data;
}

export async function createRiskTemplate(accessToken, payload) {
  return authedPost("/api/risks/templates/", accessToken, payload);
}

export async function fetchRecommendationTemplates(accessToken) {
  const data = await authedGet("/api/recommendations/templates/?page_size=200", accessToken);
  return data.results ?? data;
}

export async function createRecommendationTemplate(accessToken, payload) {
  return authedPost("/api/recommendations/templates/", accessToken, payload);
}

export async function fetchMe(accessToken) {
  return authedGet("/api/auth/me/", accessToken);
}

export async function refreshAccessToken(refreshToken) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
  } catch {
    throw new ApiError("Impossible de contacter le serveur.", 0);
  }
  if (!response.ok) {
    throw new ApiError("Session expirée.", response.status);
  }
  return response.json(); // { access }
}

export async function fetchUsers(accessToken) {
  const data = await authedGet("/api/auth/users/?page_size=200", accessToken);
  return data.results ?? data;
}

export async function createUser(accessToken, payload) {
  return authedPost("/api/auth/users/", accessToken, payload);
}

export async function updateUser(accessToken, userId, payload) {
  return authedPatch(`/api/auth/users/${userId}/`, accessToken, payload);
}

export async function login(username, password) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new ApiError(
      "Impossible de contacter le serveur. Vérifiez votre connexion réseau.",
      0
    );
  }

  if (response.status === 401) {
    throw new ApiError("Identifiant ou mot de passe incorrect.", 401);
  }

  if (response.status === 429) {
    throw new ApiError(
      "Trop de tentatives. Réessayez dans quelques minutes.",
      429
    );
  }

  if (!response.ok) {
    throw new ApiError(
      "Une erreur est survenue. Réessayez ultérieurement.",
      response.status
    );
  }

  return response.json(); // { access, refresh }
}
