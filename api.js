const API_BASE = import.meta.env.VITE_API_URL || '/api';

let authToken = localStorage.getItem('sprachstufe_token') || null;

export function setToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('sprachstufe_token', token);
  } else {
    localStorage.removeItem('sprachstufe_token');
  }
}

export function getToken() {
  return authToken;
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const error = new Error(data?.error || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  register: (name, email, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),

  getTracks: () => request('/courses/tracks'),
  getLessons: (levelId) => request(`/courses/levels/${levelId}/lessons`),
  getLesson: (lessonId) => request(`/courses/lessons/${lessonId}`),
  submitLesson: (lessonId, answers) =>
    request(`/courses/lessons/${lessonId}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  getProgressSummary: () => request('/courses/progress/summary'),

  getExams: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return request(`/exams${params ? `?${params}` : ''}`);
  },
  getExam: (examId) => request(`/exams/${examId}`),
  submitExam: (examId, answers) =>
    request(`/exams/${examId}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),

  getCertificates: () => request('/certificates'),
  certificateDownloadUrl: (certId) => `${API_BASE}/certificates/${certId}/download`,

  getChatHistory: () => request('/chat/history'),
  sendChatMessage: (message) =>
    request('/chat/message', { method: 'POST', body: JSON.stringify({ message }) }),

  upgradeToPremium: () => request('/billing/upgrade', { method: 'POST' }),
  cancelPremium: () => request('/billing/cancel', { method: 'POST' }),
};
