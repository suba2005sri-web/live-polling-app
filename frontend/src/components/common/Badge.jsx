import React from 'react';

export default function Badge({ variant = 'default', children, className = '' }) {
  if (variant === 'live') {
    return (
      <span className={`badge badge-live ${className}`.trim()}>
        <span className="badge-pulse-dot" />
        {children || 'LIVE'}
      </span>
    );
  }

  const variantClass = `badge-${variant}`;
  return (
    <span className={`badge ${variantClass} ${className}`.trim()}>
      {children}
    </span>
  );
}
