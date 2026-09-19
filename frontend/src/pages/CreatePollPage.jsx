import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HelpCircle, 
  Plus, 
  Trash2, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useToast } from '../components/common/Toast';
import { pollsAPI } from '../services/api';

export default function CreatePollPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']); // Start with 2 empty options
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Validate form
  const validate = () => {
    const errs = {};

    // Question validation
    if (!question.trim()) {
      errs.question = 'Poll question cannot be empty';
    } else if (question.trim().length < 5) {
      errs.question = 'Question should be at least 5 characters';
    }

    // Options validation
    const optionErrors = [];
    const trimmedOptions = options.map((opt) => opt.trim());

    if (trimmedOptions.length < 2) {
      errs.general = 'At least 2 options are required';
    }

    const seenOptions = new Set();

    trimmedOptions.forEach((opt, index) => {
      if (!opt) {
        optionErrors[index] = 'Option cannot be empty';
      } else if (seenOptions.has(opt.toLowerCase())) {
        optionErrors[index] = 'Duplicate option detected';
      } else {
        seenOptions.add(opt.toLowerCase());
      }
    });

    if (optionErrors.some((e) => Boolean(e))) {
      errs.options = optionErrors;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Add option
  const handleAddOption = () => {
    if (options.length >= 8) {
      toast.info('Maximum 8 options per poll allowed');
      return;
    }
    setOptions((prev) => [...prev, '']);
  };

  // Remove option
  const handleRemoveOption = (indexToRemove) => {
    if (options.length <= 2) {
      toast.info('A poll must have at least 2 options');
      return;
    }
    setOptions((prev) => prev.filter((_, idx) => idx !== indexToRemove));

    // Clear corresponding error
    if (errors.options) {
      const updatedOptErrors = errors.options.filter((_, idx) => idx !== indexToRemove);
      setErrors((prev) => ({ ...prev, options: updatedOptErrors }));
    }
  };

  // Option text change
  const handleOptionChange = (index, value) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

    if (errors.options && errors.options[index]) {
      setErrors((prev) => {
        const nextOptErrors = [...prev.options];
        nextOptErrors[index] = '';
        return { ...prev, options: nextOptErrors };
      });
    }
  };

  // Load example poll template
  const handleLoadExample = () => {
    setQuestion('What is your favourite programming language?');
    setOptions(['Go', 'Python', 'JavaScript', 'Java']);
    setErrors({});
    toast.info('Loaded example poll data');
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const newPoll = await pollsAPI.create({
        question: question.trim(),
        options: options.map((opt) => opt.trim()),
      });

      toast.success('Poll created successfully!');
      // Navigate to Poll Share Page
      navigate(`/share/${newPoll.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-narrow" style={{ padding: '3.5rem 1rem 5rem' }}>
      <div className="card">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>Create a New Poll</h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              Configure your question and answer options to launch an instant live session
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadExample}
            icon={<Sparkles size={14} color="#a855f7" />}
          >
            Load Example
          </Button>
        </div>

        {errors.general && (
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
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Question Input */}
          <div style={{ marginBottom: '2rem' }}>
            <Input
              label="Poll Question"
              id="poll-question"
              placeholder="e.g. What is your favourite programming language?"
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (errors.question) setErrors((prev) => ({ ...prev, question: '' }));
              }}
              error={errors.question}
              required
              helperText="Make your question clear and concise for the audience"
            />
          </div>

          {/* Options Section */}
          <div style={{ marginBottom: '2rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <label className="form-label" style={{ margin: 0 }}>
                <span>
                  Answer Options <span className="required">*</span>
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  (Min 2, Max 8)
                </span>
              </label>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddOption}
                disabled={options.length >= 8}
                icon={<Plus size={16} />}
              >
                Add Option
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {options.map((option, index) => {
                const optError = errors.options && errors.options[index];

                return (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {/* Option Index Circle */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-sm)',
                          background: '#1e293b',
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          flexShrink: 0,
                        }}
                      >
                        {index + 1}
                      </div>

                      {/* Input */}
                      <input
                        type="text"
                        className={`form-input ${optError ? 'has-error' : ''}`}
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        style={{ flex: 1 }}
                      />

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOption(index)}
                        disabled={options.length <= 2}
                        icon={<Trash2 size={16} />}
                        title="Remove option"
                        style={{
                          color: options.length <= 2 ? 'var(--text-muted)' : '#f87171',
                        }}
                      />
                    </div>

                    {optError && (
                      <div
                        className="form-error"
                        style={{ marginLeft: '2.6rem', marginTop: '0.35rem' }}
                      >
                        <AlertCircle size={13} />
                        <span>{optError}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1.5rem',
            }}
          >
            <Button
              variant="secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              icon={<ArrowRight size={18} />}
            >
              Create Poll
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
