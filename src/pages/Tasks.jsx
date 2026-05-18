import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PRIORITY_STYLES = {
  high:   { bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444' },
  medium: { bg: '#fef9ee', color: '#92400e', dot: '#f59e0b' },
  low:    { bg: '#ecfdf5', color: '#065f46', dot: '#10b981' },
};

const STATUS_STYLES = {
  completed:  { bg: '#ecfdf5', color: '#065f46' },
  in_progress:{ bg: '#eff6ff', color: '#1e40af' },
  pending:    { bg: '#fefce8', color: '#92400e' },
  cancelled:  { bg: '#fef2f2', color: '#991b1b' },
};

const Tasks = () => {
  const { user, isManager, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '', team_id: '' });

  const fetchTasks = useCallback(async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/tasks`, { params });
      setTasks(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.priority]);

  const fetchTeams = useCallback(async () => {
    try {
      const r = await axios.get(`${process.env.REACT_APP_API_URL}/teams`);
      setTeams(r.data.data);
    } catch (e) {}
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const r = await axios.get(`${process.env.REACT_APP_API_URL}/users`);
      setUsers(r.data.data);
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchTeams();
    if (isManager || isAdmin) fetchUsers();
  }, [fetchTasks, fetchTeams, fetchUsers, isManager, isAdmin]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/teams/${formData.team_id}/tasks`, formData);
      setTasks([response.data, ...tasks]);
      setShowCreateModal(false);
      setFormData({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '', team_id: '' });
      toast.success('Task created');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const response = await axios.patch(`${process.env.REACT_APP_API_URL}/tasks/${taskId}/status`, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? response.data : t));
      toast.success('Status updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/tasks/${taskId}`);
        setTasks(tasks.filter(t => t.id !== taskId));
        toast.success('Task deleted');
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  if (loading) return <div style={styles.loading}>Loading tasks…</div>;

  const activeFilters = [filters.status, filters.priority].filter(Boolean).length;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Tasks</h1>
          <p style={styles.subtitle}>{tasks.length} task{tasks.length !== 1 ? 's' : ''} found</p>
        </div>
        {(isManager || isAdmin) && (
          <button onClick={() => setShowCreateModal(true)} style={styles.primaryBtn}>
            <PlusIcon style={{ width: 18, height: 18 }} />
            New Task
          </button>
        )}
      </div>

      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          {['', 'pending', 'in_progress', 'completed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilters({ ...filters, status: s })}
              style={{
                ...styles.filterBtn,
                ...(filters.status === s ? styles.filterBtnActive : {}),
              }}
            >
              {s ? s.replace('_', ' ') : 'All status'}
            </button>
          ))}
        </div>
        <select
          style={styles.selectSmall}
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div style={styles.list}>
        {tasks.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyTitle}>No tasks found</p>
            <p style={styles.emptyMsg}>{activeFilters > 0 ? 'Try adjusting your filters.' : 'Create your first task to get started.'}</p>
          </div>
        ) : (
          tasks.map((task) => {
            const p = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
            const s = STATUS_STYLES[task.status] || STATUS_STYLES.pending;
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
            return (
              <div key={task.id} style={styles.taskCard}>
                <div style={{ ...styles.priorityBar, background: p.dot }} />
                <div style={styles.taskBody}>
                  <div style={styles.taskTop}>
                    <div style={styles.taskMeta}>
                      <span style={{ ...styles.badge, background: p.bg, color: p.color }}>
                        <span style={{ ...styles.dot, background: p.dot }} />
                        {task.priority}
                      </span>
                      <span style={{ ...styles.badge, background: s.bg, color: s.color }}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {isOverdue && (
                        <span style={{ ...styles.badge, background: '#fef2f2', color: '#991b1b' }}>overdue</span>
                      )}
                    </div>
                    <div style={styles.actions}>
                      {task.status !== 'completed' && task.status !== 'cancelled' && (
                        <select
                          onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                          value={task.status}
                          style={styles.statusSelect}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                      <button onClick={() => navigate(`/tasks/${task.id}`)} style={styles.iconBtn} title="View">
                        <EyeIcon style={{ width: 17, height: 17 }} />
                      </button>
                      {(isAdmin || task.created_by === user?.id) && (
                        <button onClick={() => handleDeleteTask(task.id)} style={{ ...styles.iconBtn, color: '#ef4444' }} title="Delete">
                          <TrashIcon style={{ width: 17, height: 17 }} />
                        </button>
                      )}
                    </div>
                  </div>
                  <h3 style={styles.taskTitle}>{task.title}</h3>
                  {task.description && <p style={styles.taskDesc}>{task.description}</p>}
                  <div style={styles.taskFooter}>
                    {task.assigned_user?.name && (
                      <span style={styles.footerItem}>
                        <span style={styles.avatar}>{task.assigned_user.name[0]}</span>
                        {task.assigned_user.name}
                      </span>
                    )}
                    {task.team?.name && <span style={styles.footerDivider}>·</span>}
                    {task.team?.name && <span style={styles.footerItem}>{task.team.name}</span>}
                    {task.due_date && (
                      <>
                        <span style={styles.footerDivider}>·</span>
                        <span style={{ ...styles.footerItem, color: isOverdue ? '#ef4444' : undefined }}>
                          Due {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showCreateModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Create New Task</h3>
              <button onClick={() => setShowCreateModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleCreateTask} style={styles.modalForm}>
              {[
                { label: 'Title', key: 'title', type: 'text', required: true },
              ].map(({ label, key, type, required }) => (
                <div key={key} style={styles.field}>
                  <label style={styles.label}>{label}</label>
                  <input
                    type={type}
                    required={required}
                    style={styles.input}
                    value={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div style={styles.field}>
                <label style={styles.label}>Description</label>
                <textarea rows="3" style={styles.textarea} value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div style={styles.formRow}>
                <div style={styles.field}>
                  <label style={styles.label}>Team</label>
                  <select required style={styles.input} value={formData.team_id}
                    onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}>
                    <option value="">Select team</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Priority</label>
                  <select style={styles.input} value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Assign To</label>
                <select required style={styles.input} value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}>
                  <option value="">Select user</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Due Date</label>
                <input type="datetime-local" style={styles.input} value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
              </div>
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={styles.ghostBtn}>Cancel</button>
                <button type="submit" style={styles.primaryBtn}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { fontFamily: "'DM Sans', 'Segoe UI', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' },
  title: { fontSize: '1.65rem', fontWeight: '700', color: '#1a1830', margin: 0, letterSpacing: '-0.5px' },
  subtitle: { fontSize: '0.85rem', color: '#8b8aa0', margin: '4px 0 0' },
  primaryBtn: {
    background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
    color: 'white', border: 'none', borderRadius: '10px',
    padding: '0.6rem 1.1rem', fontSize: '0.9rem', fontWeight: '600',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
    fontFamily: 'inherit',
  },
  filterBar: { display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' },
  filterGroup: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  filterBtn: {
    padding: '0.4rem 0.85rem', borderRadius: '999px', border: '1px solid #e2e0f0',
    background: 'white', color: '#8b8aa0', fontSize: '0.8rem', fontWeight: '500',
    cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
  },
  filterBtnActive: { background: '#f5f4fe', color: '#4f46e5', borderColor: '#c7d2fe', fontWeight: '600' },
  selectSmall: { padding: '0.4rem 0.7rem', borderRadius: '8px', border: '1px solid #e2e0f0', fontSize: '0.82rem', color: '#3d3b52', fontFamily: 'inherit', background: 'white' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  taskCard: {
    background: 'white', border: '1px solid #eeecf8', borderRadius: '14px',
    display: 'flex', overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(99,102,241,0.04)',
    transition: 'box-shadow 0.15s',
  },
  priorityBar: { width: '4px', flexShrink: 0 },
  taskBody: { flex: 1, padding: '1rem 1.25rem' },
  taskTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem' },
  taskMeta: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  badge: { padding: '3px 9px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px', textTransform: 'capitalize' },
  dot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  actions: { display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 },
  statusSelect: { padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e0f0', fontSize: '0.8rem', fontFamily: 'inherit', color: '#3d3b52', background: 'white' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#8b8aa0', padding: '4px', display: 'flex', borderRadius: '6px' },
  taskTitle: { fontSize: '0.95rem', fontWeight: '700', color: '#1a1830', margin: '0 0 3px' },
  taskDesc: { fontSize: '0.82rem', color: '#8b8aa0', margin: '0 0 0.6rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  taskFooter: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  footerItem: { fontSize: '0.78rem', color: '#8b8aa0', display: 'flex', alignItems: 'center', gap: '5px' },
  footerDivider: { color: '#d1d0e0', fontSize: '0.78rem' },
  avatar: {
    width: '18px', height: '18px', borderRadius: '50%',
    background: '#eef2ff', color: '#4f46e5', fontSize: '0.65rem',
    fontWeight: '700', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  empty: { textAlign: 'center', padding: '4rem 2rem' },
  emptyTitle: { fontSize: '1rem', fontWeight: '700', color: '#1a1830', margin: '0 0 6px' },
  emptyMsg: { fontSize: '0.85rem', color: '#8b8aa0', margin: 0 },
  loading: { textAlign: 'center', padding: '4rem', color: '#8b8aa0', fontSize: '0.9rem' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,24,48,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal: { background: 'white', borderRadius: '18px', padding: '2rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  modalTitle: { fontSize: '1.15rem', fontWeight: '700', color: '#1a1830', margin: 0 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#8b8aa0', fontSize: '1rem', fontFamily: 'inherit' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.78rem', fontWeight: '600', color: '#3d3b52', textTransform: 'uppercase', letterSpacing: '0.3px' },
  input: { padding: '0.6rem 0.8rem', border: '1.5px solid #e2e0f0', borderRadius: '9px', fontSize: '0.9rem', color: '#1a1830', fontFamily: 'inherit', outline: 'none', background: 'white' },
  textarea: { padding: '0.6rem 0.8rem', border: '1.5px solid #e2e0f0', borderRadius: '9px', fontSize: '0.9rem', color: '#1a1830', fontFamily: 'inherit', outline: 'none', resize: 'vertical' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' },
  ghostBtn: { background: 'none', border: '1.5px solid #e2e0f0', borderRadius: '9px', padding: '0.55rem 1rem', fontSize: '0.9rem', cursor: 'pointer', color: '#3d3b52', fontFamily: 'inherit' },
};

export default Tasks;
