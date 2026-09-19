import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  BarChart3, 
  Users, 
  Layers, 
  Search, 
  Trash2, 
  AlertTriangle,
  Radio
} from 'lucide-react';
import Button from '../components/common/Button';
import PollCard from '../components/poll/PollCard';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { pollsAPI } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'closed'
  const [deletePollId, setDeletePollId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load polls
  const loadPolls = async () => {
    try {
      setLoading(true);
      const data = await pollsAPI.list();
      setPolls(data);
    } catch (err) {
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolls();

  }, []);

  // Handle Poll Deletion
  const confirmDelete = async () => {
    if (!deletePollId) return;
    try {
      setDeleting(true);
      await pollsAPI.delete(deletePollId);
      toast.success('Poll deleted successfully');
      setDeletePollId(null);
      loadPolls();
    } catch (err) {
      toast.error('Failed to delete poll');
    } finally {
      setDeleting(false);
    }
  };

  // Compute metrics
  const totalPolls = polls.length;
  const totalVotes = polls.reduce((sum, p) => sum + (p.totalVotes || 0), 0);
  const activePollsCount = polls.filter((p) => p.status === 'active').length;

  // Filtered polls
  const filteredPolls = polls.filter((poll) => {
    const matchesSearch = poll.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || poll.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container" style={{ padding: '3rem 1.5rem 5rem' }}>
      {/* Dashboard Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.35rem' }}>Polls Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Manage your questions, monitor voter engagement, and view live results
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            size="md"
            icon={<PlusCircle size={18} />}
            onClick={() => navigate('/create')}
          >
            Create New Poll
          </Button>
        </div>
      </div>

      {/* Metric Stats Cards */}
      <div className="grid-3" style={{ marginBottom: '3rem' }}>
        {/* Metric 1 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Polls
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {totalPolls}
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Votes Collected
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {totalVotes}
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(6, 182, 212, 0.15)',
              color: '#06b6d4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Radio size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Sessions
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {activePollsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search polls by question..."
            className="form-input input-with-icon"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Status:</span>
          {['all', 'active', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                background: statusFilter === status ? 'var(--primary)' : '#1e293b',
                color: statusFilter === status ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '0.35rem 0.85rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* My Polls Grid */}
      {loading ? (
        <LoadingSpinner message="Loading your polls list..." />
      ) : filteredPolls.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <BarChart3 size={32} />
          </div>
          <h3 className="empty-state-title">No Polls Found</h3>
          <p className="empty-state-desc">
            {searchQuery
              ? `No polls matched your search query "${searchQuery}".`
              : 'You have not created any live polls yet. Launch your first interactive poll now!'}
          </p>
          <Button
            variant="primary"
            icon={<PlusCircle size={18} />}
            onClick={() => navigate('/create')}
          >
            Create Your First Poll
          </Button>
        </div>
      ) : (
        <div className="grid-3">
          {filteredPolls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onDelete={(id) => setDeletePollId(id)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletePollId)}
        onClose={() => setDeletePollId(null)}
        title="Confirm Delete Poll"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletePollId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={deleting}
              onClick={confirmDelete}
              icon={<Trash2 size={16} />}
            >
              Delete Poll
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--danger-bg)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 style={{ marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Are you sure you want to delete this poll?
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              This action cannot be undone. All collected votes and live results for this poll will be permanently removed.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
