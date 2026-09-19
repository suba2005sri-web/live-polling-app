import React from 'react';
import { Award, Users, TrendingUp } from 'lucide-react';
import ProgressBar from '../common/ProgressBar';
import Badge from '../common/Badge';
import { calculatePercentage } from '../../utils/formatters';

export default function LiveResultsChart({ poll }) {
  if (!poll || !poll.options) return null;

  const totalVotes = poll.totalVotes || 0;

  // Find max votes to identify leading option (if votes > 0)
  const maxVotes = Math.max(...poll.options.map((o) => o.votes || 0));
  const hasLeading = totalVotes > 0 && maxVotes > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {poll.options.map((option) => {
        const votes = option.votes || 0;
        const percentage = calculatePercentage(votes, totalVotes);
        const isLeading = hasLeading && votes === maxVotes;

        return (
          <div
            key={option.id}
            style={{
              padding: '1.25rem 1.4rem',
              borderRadius: 'var(--radius-lg)',
              background: isLeading ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.65)',
              border: isLeading
                ? '1px solid rgba(245, 158, 11, 0.4)'
                : '1px solid var(--border-subtle)',
              boxShadow: isLeading ? '0 4px 20px rgba(245, 158, 11, 0.1)' : 'none',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {/* Top row: Option Title + Badges + Stats */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {option.text}
                </span>

                {isLeading && (
                  <Badge variant="leading">
                    <TrendingUp size={12} />
                    Leading
                  </Badge>
                )}
              </div>

              {/* Vote numbers */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.6rem',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: isLeading ? '#fcd34d' : 'var(--text-primary)',
                  }}
                >
                  {percentage}%
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  ({votes} {votes === 1 ? 'vote' : 'votes'})
                </span>
              </div>
            </div>

            {/* Animated Progress Bar */}
            <ProgressBar
              percentage={percentage}
              isLeading={isLeading}
              height="10px"
            />
          </div>
        );
      })}
    </div>
  );
}
