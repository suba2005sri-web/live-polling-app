import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useToast } from '../components/common/Toast';
import { authAPI } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Validate form fields
  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      // Prepared for POST /api/auth/login
      await authAPI.login(formData);
      toast.success('Signed in successfully! Redirecting...');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Welcome back</h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              Sign in to manage your live polls and view real-time statistics
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@domain.com"
              icon={<Mail size={16} />}
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={16} />}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="btn-block"
              isLoading={loading}
              icon={<LogIn size={18} />}
              style={{ marginTop: '1rem' }}
            >
              Sign In
            </Button>
          </form>

          {/* Link to Sign Up */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
            }}
          >
            Don't have an account?{' '}
            <Link
              to="/signup"
              style={{
                color: 'var(--primary)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
