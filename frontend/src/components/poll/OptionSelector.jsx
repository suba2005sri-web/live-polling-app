import React from 'react';
import { Check } from 'lucide-react';

export default function OptionSelector({
  options = [],
  selectedId = null,
  onSelect,
  disabled = false,
}) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  return (
    <div
      role="radiogroup"
      aria-label="Poll options"
      style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
    >
      {options.map((option, index) => {
        const isSelected = selectedId === option.id;
        const letter = letters[index] || `${index + 1}`;

        return (
          <div
            key={option.id}
            role="radio"
            aria-checked={isSelected}
            tabIndex={disabled ? -1 : 0}
            onClick={() => !disabled && onSelect(option.id)}
            onKeyDown={(e) => {
              if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onSelect(option.id);
              }
            }}
            style={{
              padding: '1.15rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              background: isSelected ? 'rgba(99, 102, 241, 0.14)' : 'rgba(15, 23, 42, 0.65)',
              border: isSelected
                ? '2px solid var(--primary)'
                : '1px solid var(--border-subtle)',
              boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.25)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all var(--transition-fast)',
              userSelect: 'none',
              outline: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Option Letter Badge */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {letter}
              </div>

              {/* Option Text */}
              <span
                style={{
                  fontSize: '1.05rem',
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                {option.text}
              </span>
            </div>

            {/* Selection Checkmark / Indicator */}
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: isSelected ? 'none' : '2px solid rgba(255, 255, 255, 0.2)',
                background: isSelected ? 'var(--primary)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                transition: 'all var(--transition-fast)',
              }}
            >
              {isSelected && <Check size={14} strokeWidth={3} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
