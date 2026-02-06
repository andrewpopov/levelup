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
export const register = (username, password) =>
  api.post('/auth/register', { username, password });

export const login = (username, password) =>
  api.post('/auth/login', { username, password });

export const getAuthConfig = () =>
  api.get('/auth/config');

export const googleLogin = (credential) =>
  api.post('/auth/google', { credential });

// Admin
export const getAdminUsers = () =>
  api.get('/admin/users');

export const getAdminSettings = () =>
  api.get('/admin/settings');

export const updateAdminSetting = (key, value) =>
  api.put(`/admin/settings/${key}`, { value });

export const toggleUserActive = (userId, isActive) =>
  api.put(`/admin/users/${userId}/active`, { isActive });

export const addUserRole = (userId, role) =>
  api.post(`/admin/users/${userId}/roles`, { role });

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

export const getTodaysPrompt = () =>
  api.get('/questions/today');

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

export const getQuestionStatus = (questionId) =>
  api.get(`/questions/${questionId}/status`);

export const markQuestionDiscussed = (questionId, jointNotes, markAsDiscussed = true) =>
  api.post(`/questions/${questionId}/discuss`, { jointNotes, markAsDiscussed });

// Journey Book API
export const getJourneys = () =>
  api.get('/journeys');

export const getJourney = (id) =>
  api.get(`/journeys/${id}`);

export const enrollInJourney = (id, startDate) =>
  api.post(`/journeys/${id}/enroll`, { startDate });

export const getMyJourneys = () =>
  api.get('/my-journeys');

export const getJourneyTasks = (journeyId) =>
  api.get(`/my-journeys/${journeyId}/tasks`);

export const getCurrentTasks = () =>
  api.get('/tasks/current');

export const startTask = (taskId) =>
  api.post(`/tasks/${taskId}/start`);

export const completeTask = (taskId) =>
  api.post(`/tasks/${taskId}/complete`);

// Story Slots & Stories API
export const getJourneyStorySlots = (journeyId) =>
  api.get(`/journeys/${journeyId}/story-slots`);

export const getJourneyStoryProgress = (journeyId) =>
  api.get(`/journeys/${journeyId}/story-slots/progress`);

export const getJourneyStories = (journeyId) =>
  api.get(`/journeys/${journeyId}/stories`);

export const getJourneySignalCoverage = (journeyId) =>
  api.get(`/journeys/${journeyId}/signal-coverage`);

export const getSparcPrompts = (section) =>
  api.get(`/sparc-prompts/${section}`);

export const createStory = (storyData) =>
  api.post('/stories', storyData);

export const getStory = (storyId) =>
  api.get(`/stories/${storyId}`);

export const updateStorySection = (storyId, section, content) =>
  api.put(`/stories/${storyId}/sparc/${section}`, { content });

export const completeStory = (storyId) =>
  api.put(`/stories/${storyId}/complete`);

export const tagStorySignals = (storyId, signals) =>
  api.post(`/stories/${storyId}/signals`, { signals });

export default api;
