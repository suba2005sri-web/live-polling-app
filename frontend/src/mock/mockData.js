/**
 * Mock Data Store for Live Polling Tool
 * Pre-populates initial demo polls and persists updates to localStorage.
 * Used during frontend development prior to Go/Gin/MongoDB connection.
 */

const STORAGE_KEY = 'guvi_live_polls_store';

export const INITIAL_POLLS = [
  {
    id: 'poll_prog_lang',
    question: 'What is your favourite programming language?',
    options: [
      { id: 'opt_go', text: 'Go', votes: 64 },
      { id: 'opt_python', text: 'Python', votes: 58 },
      { id: 'opt_js', text: 'JavaScript', votes: 42 },
      { id: 'opt_java', text: 'Java', votes: 21 },
    ],
    totalVotes: 185,
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    creatorEmail: 'demo@guvi.in',
  },
  {
    id: 'poll_cloud_infra',
    question: 'Which cloud provider do you prefer for deploying microservices?',
    options: [
      { id: 'opt_aws', text: 'Amazon Web Services (AWS)', votes: 89 },
      { id: 'opt_gcp', text: 'Google Cloud Platform (GCP)', votes: 76 },
      { id: 'opt_azure', text: 'Microsoft Azure', votes: 34 },
      { id: 'opt_baremetal', text: 'Self-hosted / Bare Metal', votes: 19 },
    ],
    totalVotes: 218,
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
    creatorEmail: 'demo@guvi.in',
  },
  {
    id: 'poll_db_choice',
    question: 'What is your primary choice for high-concurrency database storage?',
    options: [
      { id: 'opt_mongo', text: 'MongoDB with Redis Cache', votes: 95 },
      { id: 'opt_postgres', text: 'PostgreSQL', votes: 82 },
      { id: 'opt_mysql', text: 'MySQL / MariaDB', votes: 28 },
    ],
    totalVotes: 205,
    status: 'closed',
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    creatorEmail: 'demo@guvi.in',
  },
];

/**
 * Initializes and retrieves local poll store
 */
export function getStoredPolls() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_POLLS));
      return INITIAL_POLLS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read stored polls:', err);
    return INITIAL_POLLS;
  }
}

/**
 * Saves polls array to localStorage
 */
export function saveStoredPolls(polls) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
  } catch (err) {
    console.error('Failed to save polls:', err);
  }
}

/**
 * Reset polls to defaults (useful for testing)
 */
export function resetMockPolls() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_POLLS));
  return INITIAL_POLLS;
}
