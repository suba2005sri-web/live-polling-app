import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, PlusCircle, LogIn, UserPlus, LogOut, ArrowRight, Radio } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import Input from './Input';
import { authAPI } from '../../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [pollCode, setPollCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const currentUser = authAPI.getCurrentUser();
  const isAuthenticated = authAPI.isAuthenticated();

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const clean = pollCode.trim();
    if (!clean) {
      setJoinError('Please enter a poll ID or link');
      return;
    }

    // Extract ID if full URL pasted
    let id = clean;
    if (clean.includes('/vote/')) {
      id = clean.split('/vote/')[1].split('?')[0];
    } else if (clean.includes('/results/')) {
      id = clean.split('/results/')[1].split('?')[0];
    }

    setJoinModalOpen(false);
    setPollCode('');
    setJoinError('');
    navigate(`/vote/${id}`);
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/');
  };

  return (
    <>
      <header className="navbar">
        <div className="container navbar-container">
          {/* Brand Logo */}
          <Link to="/" className="navbar-brand">
            <div className="brand-icon">
              <BarChart3 size={20} />
            </div>
            <span>Live Polling Tool</span>
          </Link>

          {/* Navigation Links */}
          <nav className="navbar-nav">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              Home
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
            <button
              onClick={() => setJoinModalOpen(true)}
              className="nav-link"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Join Poll
            </button>
          </nav>

          {/* Actions */}
          <div className="navbar-actions">
            <Button
              variant="primary"
              size="sm"
              icon={<PlusCircle size={16} />}
              onClick={() => navigate('/create')}
            >
              Create Poll
            </Button>

            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={currentUser?.email}
                >
                  {currentUser?.name || currentUser?.email?.split('@')[0]}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  icon={<LogOut size={16} />}
                  title="Sign out"
                />
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<LogIn size={15} />}
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<UserPlus size={15} />}
                  onClick={() => navigate('/signup')}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Join Poll Modal */}
      <Modal
        isOpen={joinModalOpen}
        onClose={() => {
          setJoinModalOpen(false);
          setJoinError('');
        }}
        title="Join a Live Poll"
        footer={
          <>
            <Button variant="ghost" onClick={() => setJoinModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleJoinSubmit}
              icon={<ArrowRight size={16} />}
            >
              Join Poll
            </Button>
          </>
        }
      >
        <form onSubmit={handleJoinSubmit}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '1rem' }}>
            Enter the Poll ID or paste the full voting link to join an active session.
          </p>
          <Input
            label="Poll ID or URL"
            id="join-poll-input"
            placeholder="e.g. poll_prog_lang or https://.../vote/poll_prog_lang"
            value={pollCode}
            onChange={(e) => {
              setPollCode(e.target.value);
              setJoinError('');
            }}
            error={joinError}
            autoFocus
          />
        </form>
      </Modal>
    </>
  );
}
