import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function Input({
  label,
  id,
  error,
  helperText,
  icon = null,
  required = false,
  className = '',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          <span>
            {label}
            {required && <span className="required">*</span>}
          </span>
        </label>
      )}

      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          id={inputId}
          className={`form-input ${icon ? 'input-with-icon' : ''} ${error ? 'has-error' : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
      </div>

      {error && (
        <div id={`${inputId}-error`} className="form-error" role="alert">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {!error && helperText && (
        <div id={`${inputId}-helper`} className="form-helper">
          {helperText}
        </div>
      )}
    </div>
  );
}
