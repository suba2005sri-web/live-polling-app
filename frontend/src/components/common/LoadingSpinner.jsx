import React from 'react';

export default function LoadingSpinner({
  size = 'md',
  message = 'Loading live data...',
  fullPage = false,
}) {
  const spinnerClass = size === 'lg' ? 'spinner spinner-lg' : 'spinner';

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        gap: '1rem',
      }}
    >
      <div className={spinnerClass} />
      {message && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
