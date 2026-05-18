import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, PencilSquareIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PRIORITY_STYLES = {
  high:   { bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444' },
  medium: { bg: '#fef9ee', color: '#92400e', dot: '#f59e0b' },
  low:    { bg: '#ecfdf5', color: '#065f46', dot: '#10b981' },
};

const STATUS_CONFIG = {
  pending:     { bg: '#fefce8', color: '#92400e', label: 'Pending' },
  in_progress: { bg: '#eff6ff', color: '#1e40af', label: 'In Progress' },
  completed:   { bg: '#ecfdf5', color: '#065f46', label: 'Completed' },
  cancelled:   { bg: '#fef2f2', color: '#991b1b', label: 'Cancelled' },
};

const InfoRow = ({ label, value }) => (
  <div style={styles.infoRow}>
    <span style={styles.infoLabel}>{label}</span>
    <span style={styles.infoValue}>{value || '—'}</span>
  </div>
);

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const fetchTask = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/tasks/${id}`);
      setTask(response.data);
      setFormData(response.data);
    } catch (error) {
      toast.error('Failed to fetch task');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchTask(); }, [fetchTask]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.patch(`${process.env.REACT_APP_API_URL}/tasks/${id}`, formData);
      setTask(response.data);
      setEditing(false);
      toast.success('Task updated');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await axios.patch(`${process.env.REACT_APP_API_URL}/tasks/${id}/status`, { status: newStatus });
      setTask(response.data);
      toast.success('Status updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return <div style={styles.loading}>Loading task…</div>;
  if (!task) return <div style={styles.loading}>Task not found</div>;

  const canEdit = isAdmin || isManager || task.assigned_to === user?.id;
  const p = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
  const s = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const isLocked = task.status === 'completed' || task.status === 'cancelled';

  return (
    <div style={styles.page}>
      <button onClick={() => navigate('/tasks')} style={styles.backBtn}>
        <ArrowLeftIcon style={{ width: 16, height: 16 }} />
        Back to Tasks
      </button>

      <div style={styles.topRow}>
        <div style={styles.titleArea}>
          {editing ? (
            <input
              type="text"
              style={styles.titleInput}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              autoFocus
            />
          ) : (
            <h1 style={styles.taskTitle}>{task.title}</h1>
          )}
          <div style={styles.badgeRow}>
            <span style={{ ...styles.badge, background: p.bg, color: p.color }}>
              <span style={{ ...styles.dot, background: p.dot }} />
              {task.priority} priority
            </span>
            <span style={{ ...styles.badge, background: s.bg, color: s.color }}>{s.label}</span>
          </div>
        </div>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} style={styles.editBtn}>
            <PencilSquareIcon style={{ width: 16, height: 16 }} />
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleUpdate} style={styles.editForm}>
          <div style={styles.editCard}>
            <div style={styles.field}>
              <label style={styles.label}>Description</label>
              <textarea rows="5" style={styles.textarea} value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div style={styles.formRow}>
              <div style={styles.field}>
                <label style={styles.label}>Priority</label>
                <select style={styles.select} value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Due Date</label>
                <input type="datetime-local" style={styles.select} value={formData.due_date?.slice(0, 16) || ''}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
              </div>
            </div>
          </div>
          <div style={styles.editActions}>
            <button type="button" onClick={() => setEditing(false)} style={styles.ghostBtn}>Cancel</button>
            <button type="submit" style={styles.primaryBtn}>
              <CheckIcon style={{ width: 16, height: 16 }} />
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div style={styles.contentGrid}>
          <div style={styles.mainCol}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Description</h2>
              <p style={styles.description}>{task.description || 'No description provided.'}</p>
            </div>

            {!isLocked && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Update Status</h2>
                <div style={styles.statusBtns}>
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      disabled={task.status === key}
                      style={{
                        ...styles.statusBtn,
                        background: task.status === key ? val.bg : 'white',
                        color: task.status === key ? val.color : '#8b8aa0',
                        borderColor: task.status === key ? val.color : '#e2e0f0',
                        fontWeight: task.status === key ? '700' : '500',
                      }}
                    >
                      {task.status === key && <CheckIcon style={{ width: 14, height: 14 }} />}
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={styles.sideCol}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Details</h2>
              <InfoRow label="Assigned to" value={task.assigned_user?.name} />
              <InfoRow label="Team" value={task.team?.name} />
              <InfoRow label="Created by" value={task.creator?.name} />
              <InfoRow label="Due date" value={task.due_date ? new Date(task.due_date).toLocaleString() : null} />
            </div>
          </div>
        </div>
      )}

      {task.histories && task.histories.length > 0 && (
        <div style={{ ...styles.card, marginTop: '1.5rem' }}>
          <h2 style={styles.cardTitle}>Activity History</h2>
          <div style={styles.timeline}>
            {task.histories.map((h, i) => (
              <div key={h.id} style={styles.timelineItem}>
                <div style={styles.timelineDot} />
                {i < task.histories.length - 1 && <div style={styles.timelineLine} />}
                <div style={styles.timelineContent}>
                  <p style={styles.timelineText}>
                    <strong>{h.user?.name}</strong> {h.action}
                  </p>
                  {h.changes && (
                    <pre style={styles.changesBox}>{JSON.stringify(h.changes, null, 2)}</pre>
                  )}
                  <span style={styles.timelineDate}>{new Date(h.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { fontFamily: "'DM Sans', 'Segoe UI', sans-serif", paddingBottom: '2rem' },
  loading: { textAlign: 'center', padding: '4rem', color: '#8b8aa0' },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#8b8aa0', fontSize: '0.85rem', fontWeight: '500',
    padding: 0, marginBottom: '1.5rem', fontFamily: 'inherit',
  },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  titleArea: { flex: 1, minWidth: 0 },
  taskTitle: { fontSize: '1.8rem', fontWeight: '700', color: '#1a1830', margin: '0 0 0.6rem', letterSpacing: '-0.5px', lineHeight: 1.2 },
  titleInput: { fontSize: '1.8rem', fontWeight: '700', color: '#1a1830', border: '2px solid #6366f1', borderRadius: '10px', padding: '0.3rem 0.6rem', width: '100%', fontFamily: 'inherit', outline: 'none' },
  badgeRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  badge: { padding: '4px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px', textTransform: 'capitalize' },
  dot: { width: 7, height: 7, borderRadius: '50%' },
  editBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'white', border: '1.5px solid #e2e0f0', borderRadius: '9px',
    padding: '0.5rem 0.9rem', fontSize: '0.85rem', fontWeight: '600',
    color: '#4f46e5', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
  },
  contentGrid: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' },
  mainCol: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  sideCol: {},
  card: { background: 'white', border: '1px solid #eeecf8', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(99,102,241,0.04)' },
  cardTitle: { fontSize: '0.78rem', fontWeight: '700', color: '#8b8aa0', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 1rem' },
  description: { fontSize: '0.95rem', color: '#3d3b52', lineHeight: 1.7, margin: 0 },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f5f4fe' },
  infoLabel: { fontSize: '0.82rem', color: '#8b8aa0', fontWeight: '500' },
  infoValue: { fontSize: '0.82rem', color: '#1a1830', fontWeight: '600', textAlign: 'right' },
  statusBtns: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  statusBtn: {
    padding: '0.5rem 1rem', borderRadius: '9px', border: '1.5px solid',
    fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.1s',
  },
  editForm: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  editCard: { background: 'white', border: '1px solid #eeecf8', borderRadius: '14px', padding: '1.5rem' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.78rem', fontWeight: '600', color: '#3d3b52', textTransform: 'uppercase', letterSpacing: '0.3px' },
  textarea: { padding: '0.6rem 0.8rem', border: '1.5px solid #e2e0f0', borderRadius: '9px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical' },
  select: { padding: '0.6rem 0.8rem', border: '1.5px solid #e2e0f0', borderRadius: '9px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', background: 'white' },
  editActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  ghostBtn: { background: 'none', border: '1.5px solid #e2e0f0', borderRadius: '9px', padding: '0.55rem 1rem', fontSize: '0.9rem', cursor: 'pointer', color: '#3d3b52', fontFamily: 'inherit' },
  primaryBtn: { background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: 'white', border: 'none', borderRadius: '9px', padding: '0.55rem 1.1rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' },
  timeline: { display: 'flex', flexDirection: 'column', gap: 0 },
  timelineItem: { display: 'flex', gap: '1rem', position: 'relative', paddingBottom: '1.25rem' },
  timelineDot: { width: 10, height: 10, borderRadius: '50%', background: '#c7d2fe', border: '2px solid #6366f1', flexShrink: 0, marginTop: '4px', zIndex: 1 },
  timelineLine: { position: 'absolute', left: '4px', top: '14px', bottom: 0, width: '2px', background: '#f0f0fb' },
  timelineContent: { flex: 1, paddingBottom: '0.5rem' },
  timelineText: { fontSize: '0.88rem', color: '#3d3b52', margin: '0 0 4px', lineHeight: 1.5 },
  timelineDate: { fontSize: '0.75rem', color: '#b0aec8' },
  changesBox: { background: '#f8f7ff', border: '1px solid #eeecf8', borderRadius: '6px', padding: '0.5rem', fontSize: '0.75rem', color: '#6b7280', margin: '4px 0', overflow: 'auto' },
};

export default TaskDetail;
