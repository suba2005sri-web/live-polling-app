/**
 * Utility functions for date formatting, percentages, and share URLs
 */

export function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function calculatePercentage(votes, totalVotes) {
  if (!totalVotes || totalVotes === 0) return 0;
  return Math.round((votes / totalVotes) * 100);
}

export function getPollShareUrl(pollId) {
  const origin = window.location.origin;
  return `${origin}/vote/${pollId}`;
}

export function getPollResultsUrl(pollId) {
  const origin = window.location.origin;
  return `${origin}/results/${pollId}`;
}

export function generateId() {
  return 'poll_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}
