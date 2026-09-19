import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Home } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="container-narrow" style={{ padding: '5rem 1rem', textAlign: 'center' }}>
      <div className="card empty-state">
        <div className="empty-state-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
          <HelpCircle size={36} />
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Page Not Found</h2>
        <p className="empty-state-desc">
          The page or poll route you are looking for does not exist or may have been removed.
        </p>
        <Button
          variant="primary"
          size="lg"
          icon={<Home size={18} />}
          onClick={() => navigate('/')}
        >
          Return Home
        </Button>
      </div>
    </div>
  );
}
