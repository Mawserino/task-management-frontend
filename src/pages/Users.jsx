import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, PencilIcon, StopIcon, CheckCircleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ROLE_CONFIG = {
  admin:       { bg: '#ede9fe', color: '#5b21b6', label: 'Admin' },
  manager:     { bg: '#dbeafe', color: '#1e40af', label: 'Manager' },
  team_member: { bg: '#f3f4f6', color: '#374151', label: 'Member' },
};

const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
const avatarColor = (name) => {
  const bgs = ['#eef2ff', '#ecfdf5', '#fef3c7', '#fce7f3', '#eff6ff'];
  const tc =  ['#4f46e5', '#059669', '#d97706', '#db2777', '#2563eb'];
  const i = (name?.charCodeAt(0) || 0) % bgs.length;
  return { bg: bgs[i], color: tc[i] };
};

const Users = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'team_member' });

  const fetchUsers = useCallback(async () => {
    try {
      const r = await axios.get(`${process.env.REACT_APP_API_URL}/users`);
      setUsers(r.data.data);
    } catch (e) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin, fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const r = await axios.post(`${process.env.REACT_APP_API_URL}/users`, formData);
      setUsers([...users, r.data]);
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', role: 'team_member' });
      toast.success('User created');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to create user'); }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const r = await axios.patch(`${process.env.REACT_APP_API_URL}/users/${editingUser.id}`, formData);
      setUsers(users.map(u => u.id === editingUser.id ? r.data : u));
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'team_member' });
      toast.success('User updated');
    } catch (e) { toast.error('Failed to update user'); }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_URL}/users/${userId}/status`);
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (e) { toast.error('Failed to toggle status'); }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({ name: u.name, email: u.email, role: u.role, password: '' });
  };

  if (!isAdmin) {
    return (
      <div style={styles.accessDenied}>
        <ShieldExclamationIcon style={{ width: 48, height: 48, color: '#e2e0f0', marginBottom: '1rem' }} />
        <h2 style={styles.denyTitle}>Access Restricted</h2>
        <p style={styles.denyMsg}>This page is only accessible to administrators.</p>
      </div>
    );
  }

  if (loading) return <div style={styles.loading}>Loading users…</div>;

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = users.filter(u => u.is_active).length;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Users</h1>
          <p style={styles.subtitle}>{activeCount} active · {users.length} total</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} style={styles.primaryBtn}>
          <PlusIcon style={{ width: 18, height: 18 }} />
          New User
        </button>
      </div>

      <div style={styles.searchBar}>
        <svg style={styles.searchIcon} viewBox="0 0 20 20" fill="none">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="#b0aec8" strokeWidth="1.5" />
          <path d="M13 13l3 3" stroke="#b0aec8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search users by name or email…"
          style={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div style={styles.userGrid}>
        {filtered.map((userItem) => {
          const ac = avatarColor(userItem.name);
          const rc = ROLE_CONFIG[userItem.role] || ROLE_CONFIG.team_member;
          const isSelf = userItem.id === user?.id;
          return (
            <div key={userItem.id} style={{ ...styles.userCard, opacity: userItem.is_active ? 1 : 0.65 }}>
              <div style={styles.userCardTop}>
                <div style={{ ...styles.userAvatar, background: ac.bg }}>
                  <span style={{ color: ac.color, fontWeight: '700', fontSize: '1rem' }}>{initials(userItem.name)}</span>
                </div>
                {!userItem.is_active && <div style={styles.inactivePill}>Inactive</div>}
              </div>
              <div style={styles.userInfo}>
                <h3 style={styles.userName}>{userItem.name} {isSelf && <span style={styles.youBadge}>you</span>}</h3>
                <p style={styles.userEmail}>{userItem.email}</p>
                <span style={{ ...styles.roleBadge, background: rc.bg, color: rc.color }}>{rc.label}</span>
              </div>
              <div style={styles.userActions}>
                <button onClick={() => openEditModal(userItem)} style={styles.actionBtn} title="Edit">
                  <PencilIcon style={{ width: 16, height: 16 }} />
                  Edit
                </button>
                {!isSelf && (
                  <button
                    onClick={() => handleToggleStatus(userItem.id, userItem.is_active)}
                    style={{ ...styles.actionBtn, color: userItem.is_active ? '#ef4444' : '#059669' }}
                    title={userItem.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {userItem.is_active
                      ? <><StopIcon style={{ width: 16, height: 16 }} /> Deactivate</>
                      : <><CheckCircleIcon style={{ width: 16, height: 16 }} /> Activate</>
                    }
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={styles.empty}>No users match your search.</div>
        )}
      </div>

      {(showCreateModal || editingUser) && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingUser ? 'Edit User' : 'Create New User'}</h3>
              <button onClick={() => { setShowCreateModal(false); setEditingUser(null); setFormData({ name: '', email: '', password: '', role: 'team_member' }); }} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} style={styles.modalForm}>
              <div style={styles.field}>
                <label style={styles.label}>Full Name</label>
                <input type="text" required style={styles.input} value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Jane Smith" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email Address</label>
                <input type="email" required style={styles.input} value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="jane@company.com" />
              </div>
              {!editingUser && (
                <div style={styles.field}>
                  <label style={styles.label}>Password</label>
                  <input type="password" required minLength="8" style={styles.input} value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Min. 8 characters" />
                </div>
              )}
              <div style={styles.field}>
                <label style={styles.label}>Role</label>
                <select style={styles.input} value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="team_member">Team Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => { setShowCreateModal(false); setEditingUser(null); }} style={styles.ghostBtn}>Cancel</button>
                <button type="submit" style={styles.primaryBtn}>{editingUser ? 'Save Changes' : 'Create User'}</button>
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
  loading: { textAlign: 'center', padding: '4rem', color: '#8b8aa0' },
  accessDenied: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', textAlign: 'center' },
  denyTitle: { fontSize: '1.2rem', fontWeight: '700', color: '#1a1830', margin: '0 0 0.5rem' },
  denyMsg: { fontSize: '0.9rem', color: '#8b8aa0', margin: 0 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' },
  title: { fontSize: '1.65rem', fontWeight: '700', color: '#1a1830', margin: 0, letterSpacing: '-0.5px' },
  subtitle: { fontSize: '0.85rem', color: '#8b8aa0', margin: '4px 0 0' },
  primaryBtn: { background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: 'white', border: 'none', borderRadius: '10px', padding: '0.6rem 1.1rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' },
  searchBar: { position: 'relative', marginBottom: '1.5rem' },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: '0.65rem 0.9rem 0.65rem 2.4rem', border: '1.5px solid #e2e0f0', borderRadius: '10px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', background: 'white', boxSizing: 'border-box' },
  userGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' },
  userCard: { background: 'white', border: '1px solid #eeecf8', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(99,102,241,0.04)', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  userCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  userAvatar: { width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  inactivePill: { background: '#fef2f2', color: '#991b1b', fontSize: '0.7rem', fontWeight: '700', padding: '3px 8px', borderRadius: '999px' },
  userInfo: { display: 'flex', flexDirection: 'column', gap: '3px' },
  userName: { fontSize: '0.95rem', fontWeight: '700', color: '#1a1830', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' },
  youBadge: { fontSize: '0.65rem', background: '#eef2ff', color: '#4f46e5', padding: '1px 6px', borderRadius: '999px', fontWeight: '700' },
  userEmail: { fontSize: '0.78rem', color: '#8b8aa0', margin: 0 },
  roleBadge: { fontSize: '0.72rem', fontWeight: '600', padding: '3px 8px', borderRadius: '999px', display: 'inline-block', width: 'fit-content' },
  userActions: { display: 'flex', gap: '6px', paddingTop: '0.5rem', borderTop: '1px solid #f5f4fe' },
  actionBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: 'none', border: '1px solid #e2e0f0', borderRadius: '8px', padding: '0.4rem', fontSize: '0.78rem', fontWeight: '600', color: '#6366f1', cursor: 'pointer', fontFamily: 'inherit' },
  empty: { gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#8b8aa0', fontSize: '0.9rem' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,24,48,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal: { background: 'white', borderRadius: '18px', padding: '2rem', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  modalTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#1a1830', margin: 0 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#8b8aa0', fontSize: '1rem', fontFamily: 'inherit' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.78rem', fontWeight: '600', color: '#3d3b52', textTransform: 'uppercase', letterSpacing: '0.3px' },
  input: { padding: '0.6rem 0.8rem', border: '1.5px solid #e2e0f0', borderRadius: '9px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', background: 'white' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' },
  ghostBtn: { background: 'none', border: '1.5px solid #e2e0f0', borderRadius: '9px', padding: '0.55rem 1rem', fontSize: '0.9rem', cursor: 'pointer', color: '#3d3b52', fontFamily: 'inherit' },
};

export default Users;
