import React from 'react';
import { BarChart3, Heart, Code2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 'auto',
        padding: '2.5rem 0 2rem',
        background: 'rgba(9, 13, 22, 0.9)',
      }}
    >
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="brand-icon" style={{ width: '28px', height: '28px' }}>
              <BarChart3 size={16} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              Live Polling Tool
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Architecture: React + Go/Gin API Contract
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#a5b4fc',
                fontWeight: 600,
              }}
            >
              GUVI Internship Project
            </span>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
          }}
        >
          <p>© {new Date().getFullYear()} Live Polling Tool. Frontend Only Architecture.</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            Built with <Heart size={13} color="#f43f5e" /> for Realtime Polling
          </p>
        </div>
      </div>
    </footer>
  );
}
