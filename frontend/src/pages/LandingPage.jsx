import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  ArrowRight, 
  Zap, 
  QrCode, 
  TrendingUp, 
  Users, 
  Sparkles 
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';

export default function LandingPage() {
  const navigate = useNavigate();
  const [joinInput, setJoinInput] = useState('');
  const [demoVote, setDemoVote] = useState('Go');
  const [demoVotes, setDemoVotes] = useState({ Go: 48, Python: 36, JavaScript: 28 });

  const handleDemoVote = (lang) => {
    setDemoVote(lang);
    setDemoVotes((prev) => ({
      ...prev,
      [lang]: prev[lang] + 1,
    }));
  };

  const totalDemoVotes = Object.values(demoVotes).reduce((a, b) => a + b, 0);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!joinInput.trim()) return;
    let id = joinInput.trim();
    if (id.includes('/vote/')) id = id.split('/vote/')[1].split('?')[0];
    navigate(`/vote/${id}`);
  };

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      {/* Hero Section */}
      <section className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3.5rem',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Heading & CTAs */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Badge variant="live">Realtime Audience Polling</Badge>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Powered by Go/Gin Architecture
              </span>
            </div>

            <h1 style={{ marginBottom: '1.25rem' }}>
              Gather opinions.{' '}
              <span className="text-gradient">Watch results stream live.</span>
            </h1>

            <p
              style={{
                fontSize: '1.125rem',
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
                marginBottom: '2rem',
                maxWidth: '520px',
              }}
            >
              <strong>Live Polling Tool</strong> lets you create customizable polls in seconds,
              share instant links or QR codes with your audience, and watch voting results
              update dynamically without refreshing the page.
            </p>

            {/* Primary Action Buttons */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '2.5rem',
              }}
            >
              <Button
                variant="primary"
                size="lg"
                icon={<PlusCircle size={20} />}
                onClick={() => navigate('/create')}
              >
                Create Poll
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/dashboard')}
              >
                Explore Dashboard
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>

              <Button
                variant="ghost"
                size="lg"
                onClick={() => navigate('/signup')}
              >
                Sign Up
              </Button>
            </div>

            {/* Quick Join Input Box */}
            <form
              onSubmit={handleJoin}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.4rem 0.5rem 0.4rem 1rem',
                maxWidth: '440px',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <input
                type="text"
                placeholder="Have a poll code? Enter it here..."
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem',
                  flex: 1,
                }}
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={<ArrowRight size={16} />}
              >
                Join Poll
              </Button>
            </form>
          </div>

          {/* Right Column: Live Interactive Demo Card */}
          <div>
            <div
              className="card"
              style={{
                background: 'linear-gradient(145deg, rgba(19, 28, 48, 0.95), rgba(11, 17, 30, 0.95))',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.15)',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} color="#818cf8" />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase' }}>
                    Interactive Live Demo
                  </span>
                </div>
                <Badge variant="live">Live Stream</Badge>
              </div>

              {/* Question */}
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                What is your favourite programming language?
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Click an option below to simulate casting a live vote!
              </p>

              {/* Options list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                {Object.entries(demoVotes).map(([lang, votes]) => {
                  const percent = Math.round((votes / totalDemoVotes) * 100);
                  const isSelected = demoVote === lang;
                  const isLeading = votes === Math.max(...Object.values(demoVotes));

                  return (
                    <div
                      key={lang}
                      onClick={() => handleDemoVote(lang)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                        border: isSelected
                          ? '1px solid var(--primary)'
                          : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.4rem',
                        }}
                      >
                        <span style={{ fontWeight: isSelected ? 700 : 500, fontSize: '0.95rem' }}>
                          {lang} {isSelected && '✓'}
                        </span>
                        <span style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>
                          {percent}% ({votes})
                        </span>
                      </div>
                      <ProgressBar percentage={percent} isLeading={isLeading} height="8px" />
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '1rem',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={14} color="#38bdf8" />
                  <span>Total Votes: <strong>{totalDemoVotes}</strong></span>
                </div>
                <span style={{ color: 'var(--primary)' }}>Updates instantaneously</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="container" style={{ marginTop: '5.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '0.75rem' }}>Engineered for Seamless Polling</h2>
          <p style={{ maxWidth: '600px', margin: '0 auto' }}>
            A complete polling pipeline designed for instant audience interaction, from setup to live results visualization.
          </p>
        </div>

        <div className="grid-3">
          <div className="card">
            <div className="empty-state-icon" style={{ margin: '0 0 1.25rem' }}>
              <Zap size={28} />
            </div>
            <h4 style={{ marginBottom: '0.5rem' }}>Instant Poll Creation</h4>
            <p style={{ fontSize: '0.9375rem' }}>
              Create dynamic multi-choice polls in seconds with input validation, duplicate prevention, and flexible option ordering.
            </p>
          </div>

          <div className="card">
            <div className="empty-state-icon" style={{ margin: '0 0 1.25rem' }}>
              <QrCode size={28} />
            </div>
            <h4 style={{ marginBottom: '0.5rem' }}>Effortless Sharing & QR</h4>
            <p style={{ fontSize: '0.9375rem' }}>
              Share unique voting links or let in-person attendees scan generated QR codes straight from your screen or presentation.
            </p>
          </div>

          <div className="card">
            <div className="empty-state-icon" style={{ margin: '0 0 1.25rem' }}>
              <TrendingUp size={28} />
            </div>
            <h4 style={{ marginBottom: '0.5rem' }}>Real-time Live Results</h4>
            <p style={{ fontSize: '0.9375rem' }}>
              Watch results stream in real time with dynamic percentage bars, leading choice indicators, and total voter tallies.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
