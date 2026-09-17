import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// User endpoints
export const createUser = (data) => api.post('/users', data);
export const getUsers = () => api.get('/users');
export const getUser = (id) => api.get(`/users/${id}`);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const logProgress = (id, weight) => api.put(`/users/${id}/progress`, { weight });
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Meal endpoints
export const getMealPlan = (userId) => api.get(`/meals/plan/${userId}`);
export const searchFoods = (query) => api.get('/meals/foods', { params: { search: query } });
export const logMeal = (data) => api.post('/meals/log', data);
export const getMealHistory = (userId, days = 7) => api.get(`/meals/history/${userId}`, { params: { days } });

// Workout endpoints
export const getPrograms = () => api.get('/workouts/programs');
export const getProgram = (id) => api.get(`/workouts/programs/${id}`);
export const getSchedule = (userId) => api.get(`/workouts/schedule/${userId}`);
export const logWorkout = (data) => api.post('/workouts/log', data);
export const getWorkoutHistory = (userId, days = 30) => api.get(`/workouts/history/${userId}`, { params: { days } });

// Exercise endpoints
export const getExercises = (params) => api.get('/exercises', { params });
export const getExercise = (id) => api.get(`/exercises/${id}`);

export default api;
