import React from 'react';

export default function ProgressBar({
  percentage = 0,
  isLeading = false,
  className = '',
  height = '12px',
}) {
  const safePercent = Math.min(100, Math.max(0, percentage));

  return (
    <div
      className={`progress-track ${className}`.trim()}
      style={{ height }}
      role="progressbar"
      aria-valuenow={safePercent}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        className={`progress-fill ${isLeading ? 'progress-fill-leading' : ''}`}
        style={{ width: `${safePercent}%` }}
      />
    </div>
  );
}
