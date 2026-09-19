import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  BarChart2, 
  AlertCircle, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import OptionSelector from '../components/poll/OptionSelector';
import Badge from '../components/common/Badge';
import { useToast } from '../components/common/Toast';
import { pollsAPI } from '../services/api';

export default function VotingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [poll, setPoll] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionText, setVotedOptionText] = useState('');

  // Check if user already voted in this browser session
  useEffect(() => {
    async function loadPoll() {
      try {
        setLoading(true);
        const data = await pollsAPI.getById(id);
        setPoll(data);

        // Check localStorage for prior vote
        const storedVote = localStorage.getItem(`voted_${id}`);
        if (storedVote) {
          const priorOption = data.options.find((o) => o.id === storedVote);
          if (priorOption) {
            setHasVoted(true);
            setVotedOptionText(priorOption.text);
            setSelectedOptionId(storedVote);
          }
        }
      } catch (err) {
        setError(err.message || 'Unable to load poll');
      } finally {
        setLoading(false);
      }
    }

    loadPoll();
  }, [id]);

  // Handle vote submission
  const handleSubmitVote = async (e) => {
    e.preventDefault();

    if (!selectedOptionId) {
      setValidationError('Please select an option before submitting your vote.');
      return;
    }

    setValidationError('');

    try {
      setSubmitting(true);
      // Prepared for POST /api/polls/:id/vote
      const response = await pollsAPI.vote(id, selectedOptionId);
      
      const chosenOpt = poll.options.find((o) => o.id === selectedOptionId);
      setVotedOptionText(chosenOpt?.text || '');
      setHasVoted(true);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#8b5cf6', '#d946ef', '#10b981'],
        });
      } catch (e) {
        // Fallback gracefully if canvas confetti fails
      }

      toast.success('Your vote has been counted!');
    } catch (err) {
      toast.error(err.message || 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading audience ballot..." />;
  }

  if (error || !poll) {
    return (
      <div className="container-narrow" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="card">
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Poll Unavailable</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {error || 'The poll you are attempting to vote on could not be found.'}
          </p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Poll Closed View
  if (poll.status === 'closed') {
    return (
      <div className="container-narrow" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="card">
          <Badge variant="closed" style={{ marginBottom: '1rem' }}>Voting Closed</Badge>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{poll.question}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            This poll has ended and is no longer accepting new votes. You can still inspect the final live results.
          </p>
          <Button
            variant="primary"
            size="lg"
            icon={<BarChart2 size={18} />}
            onClick={() => navigate(`/results/${poll.id}`)}
          >
            View Final Results
          </Button>
        </div>
      </div>
    );
  }

  // Confirmation State (After Voting)
  if (hasVoted) {
    return (
      <div className="container-narrow" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="card">
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <Badge variant="live" style={{ marginBottom: '1rem' }}>
            Vote Recorded
          </Badge>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>
            Thank you for participating!
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '1.5rem' }}>
            Your response has been registered in real time for:
          </p>

          <div
            style={{
              padding: '1.25rem',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '520px',
              margin: '0 auto 2rem',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Question:
            </div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '1rem' }}>
              {poll.question}
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Your Selection:
            </div>
            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.05rem' }}>
              ✓ {votedOptionText}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="lg"
              icon={<BarChart2 size={18} />}
              onClick={() => navigate(`/results/${poll.id}`)}
            >
              Watch Live Results
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                // Allow changing vote in mock mode
                localStorage.removeItem(`voted_${id}`);
                setHasVoted(false);
              }}
              icon={<RotateCcw size={16} />}
            >
              Change Vote (Demo)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active Voting Screen
  return (
    <div className="container-narrow" style={{ padding: '3.5rem 1rem 5rem' }}>
      <div className="card">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          <Badge variant="live">Audience Voting</Badge>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Single Choice
          </span>
        </div>

        {/* Question */}
        <h2 style={{ fontSize: '1.65rem', lineHeight: 1.35, marginBottom: '0.75rem' }}>
          {poll.question}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '2rem' }}>
          Select an option below and submit your vote. Results update instantly.
        </p>

        {/* Validation error if empty submit */}
        {validationError && (
          <div
            className="form-error"
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{validationError}</span>
          </div>
        )}

        {/* Options List */}
        <form onSubmit={handleSubmitVote}>
          <div style={{ marginBottom: '2.5rem' }}>
            <OptionSelector
              options={poll.options}
              selectedId={selectedOptionId}
              onSelect={(optId) => {
                setSelectedOptionId(optId);
                setValidationError('');
              }}
              disabled={submitting}
            />
          </div>

          {/* Action Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/results/${poll.id}`)}
              icon={<BarChart2 size={16} />}
            >
              Skip to Live Results
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={submitting}
              disabled={!selectedOptionId}
              icon={<ArrowRight size={18} />}
            >
              Submit Vote
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
