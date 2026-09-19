import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useToast } from '../components/common/Toast';
import { authAPI } from '../services/api';

export default function SignUpPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

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

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
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
      // Prepared for POST /api/auth/signup
      await authAPI.signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      toast.success('Account created successfully! Welcome aboard.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Create your account</h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              Join to create live polls, share voting links, and view analytics
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              icon={<User size={16} />}
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />

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
              placeholder="Minimum 6 characters"
              icon={<Lock size={16} />}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              icon={<Lock size={16} />}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="btn-block"
              isLoading={loading}
              icon={<UserPlus size={18} />}
              style={{ marginTop: '1rem' }}
            >
              Sign Up
            </Button>
          </form>

          {/* Link to Login */}
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
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: 'var(--primary)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
