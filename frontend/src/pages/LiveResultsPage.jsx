import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BarChart2, 
  Users, 
  Share2, 
  Vote, 
  RefreshCw, 
  Clock,
  Radio
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import LiveResultsChart from '../components/poll/LiveResultsChart';
import { useLivePollResults } from '../hooks/useLivePollResults';
import { useToast } from '../components/common/Toast';
import { getPollShareUrl } from '../utils/formatters';

export default function LiveResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    poll,
    loading,
    error,
    isLive,
    lastUpdated,
    connectionType,
    refetch,
  } = useLivePollResults(id);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getPollShareUrl(id));
      toast.success('Poll share link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (loading && !poll) {
    return <LoadingSpinner fullPage message="Connecting to live stream..." />;
  }

  if (error || !poll) {
    return (
      <div className="container-narrow" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>Results Unavailable</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {error || 'The poll results could not be retrieved.'}
          </p>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const totalVotes = poll.totalVotes || 0;

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem' }}>
      <div className="container-narrow">
        {/* Top Controls Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Live Beacon Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Badge variant="live">
              {isLive ? 'LIVE' : 'SYNCING'}
            </Badge>

            <span
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Radio size={13} color="#10b981" />
              Updates stream automatically
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<Share2 size={14} />}
              onClick={handleCopyLink}
            >
              Share
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={<Vote size={14} />}
              onClick={() => navigate(`/vote/${poll.id}`)}
            >
              Vote
            </Button>
          </div>
        </div>

        {/* Main Results Card */}
        <div className="card">
          {/* Header */}
          <div
            style={{
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--primary)',
                letterSpacing: '0.05em',
              }}
            >
              Live Polling Results
            </span>

            <h1
              style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
                margin: '0.4rem 0 1rem',
                lineHeight: 1.3,
              }}
            >
              {poll.question}
            </h1>

            {/* Total Votes Counter Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '0.85rem 1.25rem',
                background: 'rgba(10, 17, 32, 0.7)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Users size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Total Audience Votes
                  </div>
                  <div
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {totalVotes}
                  </div>
                </div>
              </div>

              {lastUpdated && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8125rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Clock size={13} />
                  <span>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Option Breakdown Progress Bars */}
          <LiveResultsChart poll={poll} />

          {/* Footer information */}
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              marginTop: '2.5rem',
              paddingTop: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <span>
              Realtime Protocol: <strong>{connectionType.toUpperCase()}</strong> (Redis stream ready)
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              icon={<RefreshCw size={14} />}
            >
              Manual Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
