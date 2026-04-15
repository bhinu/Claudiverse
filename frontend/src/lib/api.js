const API_BASE = 'http://localhost:3001/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(url, config);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Students
  getStudents: () => request('/students'),
  getStudent: (id) => request(`/students/${id}`),
  onboard: (data) => request('/students/onboard', { method: 'POST', body: data }),
  getReadiness: (id) => request(`/students/${id}/readiness`),

  // Suggestions
  generateSuggestion: (studentId) => request('/suggestions/generate', { method: 'POST', body: { student_id: studentId } }),
  acceptSuggestion: (id) => request(`/suggestions/${id}/accept`, { method: 'POST' }),
  declineSuggestion: (id, reason) => request(`/suggestions/${id}/decline`, { method: 'POST', body: { reason } }),
  getStudentSuggestions: (studentId) => request(`/suggestions/student/${studentId}`),

  // Interactions
  getInteraction: (id) => request(`/interactions/${id}`),
  getStudentInteractions: (studentId) => request(`/interactions/student/${studentId}`),
  updateInteractionStatus: (id, status) => request(`/interactions/${id}/status`, { method: 'PUT', body: { status } }),
  submitReflection: (interactionId, data) => request(`/interactions/${interactionId}/reflect`, { method: 'POST', body: data }),

  // Anchors
  getStudentAnchors: (studentId) => request(`/anchors/student/${studentId}`),
  createAnchor: (data) => request('/anchors', { method: 'POST', body: data }),
  updateAnchorHealth: (id) => request(`/anchors/${id}/health`, { method: 'POST' }),

  // Dashboard
  getDashboard: () => request('/dashboard/overview'),
};
