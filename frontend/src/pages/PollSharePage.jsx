import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Copy, 
  Check, 
  Share2, 
  ExternalLink, 
  BarChart2, 
  LayoutDashboard, 
  CheckCircle2, 
  Vote,
  Sparkles
} from 'lucide-react';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import QRCodeCard from '../components/poll/QRCodeCard';
import { useToast } from '../components/common/Toast';
import { pollsAPI } from '../services/api';
import { getPollShareUrl, getPollResultsUrl } from '../utils/formatters';

export default function PollSharePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadPoll() {
      try {
        setLoading(true);
        const data = await pollsAPI.getById(id);
        setPoll(data);
      } catch (err) {
        setError(err.message || 'Poll not found');
      } finally {
        setLoading(false);
      }
    }
    loadPoll();
  }, [id]);

  const shareUrl = getPollShareUrl(id);
  const resultsUrl = getPollResultsUrl(id);

  // Copy link handler
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Poll link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  // Web Share API handler
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Vote on: ${poll?.question}`,
          text: `Cast your vote on: "${poll?.question}"`,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Preparing poll share view..." />;
  }

  if (error || !poll) {
    return (
      <div className="container-narrow" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>Poll Not Found</h3>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            The requested poll ID could not be found in the local or remote database.
          </p>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-narrow" style={{ padding: '3.5rem 1rem 5rem' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        {/* Success Header */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <CheckCircle2 size={32} />
        </div>

        <h2 style={{ fontSize: '1.85rem', marginBottom: '0.5rem' }}>Your Poll is Live!</h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Share this link or QR code with your audience to start collecting live votes
        </p>

        {/* Poll Question Display Card */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '2rem',
            textAlign: 'left',
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
            Poll Question
          </span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '0.35rem', color: 'var(--text-primary)' }}>
            {poll.question}
          </h3>
          <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {poll.options.length} options configured
          </div>
        </div>

        {/* Share Link Box */}
        <div style={{ marginBottom: '2.5rem' }}>
          <label
            style={{
              display: 'block',
              textAlign: 'left',
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            Audience Voting Link
          </label>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 0.5rem 0.5rem 1rem',
            }}
          >
            <input
              type="text"
              readOnly
              value={shareUrl}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                flex: 1,
                outline: 'none',
              }}
            />

            <Button
              variant={copied ? 'secondary' : 'primary'}
              size="sm"
              icon={copied ? <Check size={16} /> : <Copy size={16} />}
              onClick={handleCopyLink}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={<Share2 size={16} />}
              onClick={handleNativeShare}
              title="Share via device"
            >
              Share
            </Button>
          </div>
        </div>

        {/* QR Code Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <QRCodeCard url={shareUrl} size={180} />
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Audience members can scan this QR code on their mobile cameras to vote instantly.
          </p>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
          }}
        >
          <Button
            variant="primary"
            size="lg"
            icon={<Vote size={18} />}
            onClick={() => navigate(`/vote/${poll.id}`)}
          >
            View Poll (Vote)
          </Button>

          <Button
            variant="secondary"
            size="lg"
            icon={<BarChart2 size={18} />}
            onClick={() => navigate(`/results/${poll.id}`)}
          >
            View Live Results
          </Button>

          <Button
            variant="outline"
            size="lg"
            icon={<LayoutDashboard size={18} />}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
