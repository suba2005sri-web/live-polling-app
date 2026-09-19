import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, BarChart2, CheckCircle, Share2, Trash2, ExternalLink } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatDate } from '../../utils/formatters';

export default function PollCard({
  poll,
  onDelete,
  onToggleStatus,
  onShare,
}) {
  const navigate = useNavigate();
  const isActive = poll.status === 'active';

  return (
    <div
      className="card card-interactive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
    >
      {/* Top Header: Status + Date */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            gap: '0.5rem',
          }}
        >
          {isActive ? (
            <Badge variant="live">Active</Badge>
          ) : (
            <Badge variant="closed">Closed</Badge>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
            }}
          >
            <Calendar size={13} />
            <span>{formatDate(poll.createdAt)}</span>
          </div>
        </div>

        {/* Poll Question */}
        <h4
          style={{
            fontSize: '1.15rem',
            lineHeight: 1.4,
            marginBottom: '1.25rem',
            color: 'var(--text-primary)',
          }}
        >
          {poll.question}
        </h4>

        {/* Stats Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: '1.5rem',
            padding: '0.6rem 0.9rem',
            background: 'rgba(10, 17, 32, 0.6)',
            borderRadius: 'var(--radius-md)',
            width: 'fit-content',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Users size={15} color="#818cf8" />
            <span>
              <strong>{poll.totalVotes || 0}</strong> votes
            </span>
          </div>
          <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />
          <span>{poll.options?.length || 0} options</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/vote/${poll.id}`)}
            icon={<CheckCircle size={14} />}
          >
            Vote
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/results/${poll.id}`)}
            icon={<BarChart2 size={14} />}
          >
            Live Results
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/share/${poll.id}`)}
            icon={<Share2 size={14} />}
            title="Share Poll"
          />
        </div>

        {onDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(poll.id)}
            icon={<Trash2 size={14} />}
            title="Delete poll"
          />
        )}
      </div>
    </div>
  );
}
