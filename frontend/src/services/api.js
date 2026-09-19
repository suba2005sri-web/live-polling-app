/**
 * API Service Layer for Live Polling Tool
 * 
 * Configured via environment variable VITE_API_BASE_URL.
 * Prepared for future Go/Gin backend with MongoDB and Redis realtime updates.
 * All application data is served by the Go API. The legacy mock branches remain
 * below only as compatibility code for the existing page contracts.
 */

import { getStoredPolls, saveStoredPolls } from '../mock/mockData';
import { generateId } from '../utils/formatters';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const USE_MOCK = false;

// BroadcastChannel for cross-tab realtime updates in mock mode
const broadcastChannel = null;

/**
 * Real HTTP client helper for future Go/Gin backend
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.message || `API Error: ${response.status} ${response.statusText}`);
    error.status = response.status;
    error.data = errorBody;
    throw error;
  }

  return response.json();
}

/**
 * ============================================================================
 * AUTHENTICATION API
 * Prepared for:
 *   POST /api/auth/signup
 *   POST /api/auth/login
 * ============================================================================
 */
export const authAPI = {
  /**
   * Registers a new user
   * @param {Object} userData - { name, email, password }
   */
  async signup(userData) {
    if (!USE_MOCK) {
      const result = await request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      return result;
    }

    // Mock implementation
    await new Promise((res) => setTimeout(res, 400));
    const token = 'mock_jwt_token_' + Date.now();
    const user = {
      id: 'user_' + Math.random().toString(36).substring(2, 7),
      name: userData.name,
      email: userData.email,
    };
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    return { success: true, token, user };
  },

  /**
   * Logs in an existing user
   * @param {Object} credentials - { email, password }
   */
  async login(credentials) {
    if (!USE_MOCK) {
      const result = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      return result;
    }

    // Mock implementation
    await new Promise((res) => setTimeout(res, 400));
    const token = 'mock_jwt_token_' + Date.now();
    const user = {
      id: 'user_guvi_demo',
      name: credentials.email.split('@')[0] || 'Demo User',
      email: credentials.email,
    };
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    return { success: true, token, user };
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  getCurrentUser() {
    try {
      const user = localStorage.getItem('auth_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem('auth_token'));
  },
};

/**
 * ============================================================================
 * POLLS API
 * Prepared for:
 *   POST   /api/polls
 *   GET    /api/polls
 *   GET    /api/polls/:id
 *   POST   /api/polls/:id/vote
 *   GET    /api/polls/:id/results
 *   PUT    /api/polls/:id
 *   DELETE /api/polls/:id
 * ============================================================================
 */
export const pollsAPI = {
  /**
   * Creates a new poll
   * @param {Object} pollData - { question, options: string[] }
   */
  async create(pollData) {
    if (!USE_MOCK) {
      return request('/polls', {
        method: 'POST',
        body: JSON.stringify(pollData),
      });
    }

    // Mock implementation
    await new Promise((res) => setTimeout(res, 350));
    const polls = getStoredPolls();
    const user = authAPI.getCurrentUser() || { email: 'anonymous@poll.app' };

    const newPoll = {
      id: generateId(),
      question: pollData.question.trim(),
      options: pollData.options.map((opt, idx) => ({
        id: `opt_${idx + 1}_${Date.now().toString(36)}`,
        text: opt.trim(),
        votes: 0,
      })),
      totalVotes: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      creatorEmail: user.email,
    };

    polls.unshift(newPoll);
    saveStoredPolls(polls);

    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'POLL_CREATED', poll: newPoll });
    }

    return newPoll;
  },

  /**
   * Lists all polls (for the dashboard)
   */
  async list() {
    if (!USE_MOCK) {
      return request('/my-polls', { method: 'GET' });
    }

    await new Promise((res) => setTimeout(res, 300));
    return getStoredPolls();
  },

  /**
   * Fetches a poll by its unique ID
   */
  async getById(id) {
    if (!USE_MOCK) {
      return request(`/polls/${id}`, { method: 'GET' });
    }

    await new Promise((res) => setTimeout(res, 200));
    const polls = getStoredPolls();
    const found = polls.find((p) => p.id === id);
    if (!found) {
      const err = new Error('Poll not found');
      err.status = 404;
      throw err;
    }
    return found;
  },

  /**
   * Casts a vote on a specific poll option
   * @param {string} pollId 
   * @param {string} optionId 
   */
  async vote(pollId, optionId) {
    if (!USE_MOCK) {
      return request(`/polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionId }),
      });
    }

    // Mock implementation
    await new Promise((res) => setTimeout(res, 300));
    const polls = getStoredPolls();
    const pollIndex = polls.findIndex((p) => p.id === pollId);
    
    if (pollIndex === -1) {
      const err = new Error('Poll not found');
      err.status = 404;
      throw err;
    }

    const poll = { ...polls[pollIndex] };
    if (poll.status === 'closed') {
      const err = new Error('This poll is closed and no longer accepting votes');
      err.status = 400;
      throw err;
    }

    const option = poll.options.find((o) => o.id === optionId);
    if (!option) {
      const err = new Error('Selected option not found');
      err.status = 400;
      throw err;
    }

    // Increment vote
    option.votes += 1;
    poll.totalVotes += 1;
    poll.updatedAt = new Date().toISOString();
    polls[pollIndex] = poll;
    saveStoredPolls(polls);

    // Save vote flag in localStorage to prevent repeat votes
    const votedKey = `voted_${pollId}`;
    localStorage.setItem(votedKey, optionId);

    // Broadcast realtime event across open tabs
    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'VOTE_CAST',
        pollId,
        poll,
      });
    }

    return {
      success: true,
      message: 'Vote registered successfully',
      poll,
    };
  },

  /**
   * Retrieves poll results for live display
   */
  async getResults(id) {
    if (!USE_MOCK) {
      return request(`/polls/${id}/results`, { method: 'GET' });
    }

    return this.getById(id);
  },

  /**
   * Updates a poll status or details
   */
  async update(id, data) {
    if (!USE_MOCK) {
      return request(`/polls/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }

    const polls = getStoredPolls();
    const index = polls.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Poll not found');

    polls[index] = {
      ...polls[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveStoredPolls(polls);

    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'POLL_UPDATED', poll: polls[index] });
    }

    return polls[index];
  },

  /**
   * Deletes a poll
   */
  async delete(id) {
    if (!USE_MOCK) {
      return request(`/polls/${id}`, { method: 'DELETE' });
    }

    const polls = getStoredPolls();
    const filtered = polls.filter((p) => p.id !== id);
    saveStoredPolls(filtered);

    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'POLL_DELETED', pollId: id });
    }

    return { success: true };
  },
};

/**
 * Helper to get the Realtime Stream URL for future Go/Gin WebSocket or SSE connection
 */
export function getRealtimeEndpoint(pollId) {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const apiHost = API_BASE_URL.replace(/^https?:\/\//, '').replace(/\/api\/?$/, '');
  return `${wsProtocol}//${apiHost}/api/ws/polls/${pollId}`;
}

export { broadcastChannel };
