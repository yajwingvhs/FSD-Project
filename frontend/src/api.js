import axios from 'axios';

// Configure Axios instance to send session cookies with every request
export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

export const CATEGORIES = [
  'Programming',
  'Web Development',
  'Design',
  'Data Science',
  'Languages',
  'Music & Arts',
  'Writing',
  'Other',
];

export const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

