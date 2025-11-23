import axios from 'axios';

const API_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (username, password, displayName) =>
  api.post('/auth/register', { username, password, displayName });

export const login = (username, password) =>
  api.post('/auth/login', { username, password });

// Journal Entries
export const getJournalEntries = (startDate, endDate) =>
  api.get('/journal-entries', { params: { startDate, endDate } });

export const createJournalEntry = (entry) =>
  api.post('/journal-entries', entry);

export const updateJournalEntry = (id, entry) =>
  api.put(`/journal-entries/${id}`, entry);

export const deleteJournalEntry = (id) =>
  api.delete(`/journal-entries/${id}`);

// Memories
export const getMemories = () =>
  api.get('/memories');

export const createMemory = (formData) =>
  api.post('/memories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const deleteMemory = (id) =>
  api.delete(`/memories/${id}`);

// Gratitude
export const getGratitudeEntries = () =>
  api.get('/gratitude');

export const createGratitudeEntry = (entry) =>
  api.post('/gratitude', entry);

export const deleteGratitudeEntry = (id) =>
  api.delete(`/gratitude/${id}`);

// Goals
export const getGoals = () =>
  api.get('/goals');

export const createGoal = (goal) =>
  api.post('/goals', goal);

export const updateGoal = (id, goal) =>
  api.put(`/goals/${id}`, goal);

export const deleteGoal = (id) =>
  api.delete(`/goals/${id}`);

// Questions
export const getQuestionCategories = () =>
  api.get('/questions/categories');

export const getQuestions = () =>
  api.get('/questions');

export const getQuestionsByCategory = (categoryId) =>
  api.get(`/questions/category/${categoryId}`);

export const getQuestionByWeek = (weekNumber) =>
  api.get(`/questions/week/${weekNumber}`);

export const getQuestion = (id) =>
  api.get(`/questions/${id}`);

export const saveQuestionResponse = (id, response_text) =>
  api.post(`/questions/${id}/response`, { response_text });

export const deleteQuestionResponse = (questionId) =>
  api.delete(`/questions/${questionId}/response`);

export default api;
