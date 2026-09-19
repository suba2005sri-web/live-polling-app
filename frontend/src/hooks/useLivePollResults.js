import { useState, useEffect, useCallback, useRef } from 'react';
import { pollsAPI, getRealtimeEndpoint } from '../services/api';

/**
 * Custom hook to manage realtime poll results.
 * Prepared for future Go/Gin backend with Redis Pub/Sub over WebSocket / SSE.
 * 
 * Connects to the Go WebSocket endpoint backed by Redis Pub/Sub.
 *
 * @param {string} pollId 
 * @param {Object} config - { simulateVotes: boolean }
 */
export function useLivePollResults(pollId, { simulateVotes = false } = {}) {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connectionType, setConnectionType] = useState('websocket');
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);

  // Fetch initial poll results
  const fetchResults = useCallback(async () => {
    if (!pollId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await pollsAPI.getResults(pollId);
      setPoll(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch poll results:', err);
      setError(err.message || 'Unable to load poll results');
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  // Initial load
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Realtime subscription setup
  useEffect(() => {
    if (!pollId) return;

    let disposed = false;
    const connect = () => {
      if (disposed) return;
      setIsLive(false);
      setConnectionType(reconnectAttemptRef.current ? 'reconnecting' : 'websocket');
      const socket = new WebSocket(getRealtimeEndpoint(pollId));
      socketRef.current = socket;
      socket.onopen = () => { reconnectAttemptRef.current = 0; setIsLive(true); setConnectionType('websocket'); };
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.pollId !== pollId || !data.results) return;
        setPoll((previous) => previous ? { ...previous, totalVotes: data.totalVotes, options: previous.options.map((option) => ({ ...option, votes: data.results[option.id] || 0 })) } : previous);
        setLastUpdated(new Date());
      };
      socket.onclose = () => {
        if (disposed) return;
        reconnectAttemptRef.current += 1;
        reconnectTimerRef.current = window.setTimeout(connect, Math.min(1000 * 2 ** reconnectAttemptRef.current, 10000));
      };
      socket.onerror = () => socket.close();
    };
    connect();
    return () => { disposed = true; window.clearTimeout(reconnectTimerRef.current); socketRef.current?.close(); };
  }, [pollId, fetchResults]);

  return {
    poll,
    loading,
    error,
    isLive,
    lastUpdated,
    connectionType,
    refetch: fetchResults,
  };
}
