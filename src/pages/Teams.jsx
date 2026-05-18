import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Teams = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ name: '', user_id: '' });

  const fetchTeams = useCallback(async () => {
    try {
      const r = await axios.get(`${process.env.REACT_APP_API_URL}/teams`);
      setTeams(r.data.data);
    } catch (e) {
      toast.error('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const r = await axios.get(`${process.env.REACT_APP_API_URL}/users`);
      setUsers(r.data.data);
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchTeams();
    if (isAdmin || isManager) fetchUsers();
  }, [fetchTeams, fetchUsers, isAdmin, isManager]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const r = await axios.post(`${process.env.REACT_APP_API_URL}/teams`, { name: formData.name });
      setTeams([...teams, r.data]);
      setShowCreateModal(false);
      setFormData({ name: '', user_id: '' });
      toast.success('Team created');
    } catch (e) { toast.error('Failed to create team'); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/teams/${selectedTeam.id}/members`, { user_id: formData.user_id });
      await fetchTeams();
      setShowAddMemberModal(false);
      setFormData({ name: '', user_id: '' });
      toast.success('Member added');
    } catch (e) { toast.error('Failed to add member'); }
  };

  const handleRemoveMember = async (teamId, userId) => {
    if (window.confirm('Remove this member?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/teams/${teamId}/members/${userId}`);
        await fetchTeams();
        toast.success('Member removed');
      } catch (e) { toast.error('Failed to remove member'); }
    }
  };

  const canManageTeam = (team) => {
    if (isAdmin) return true;
    const isLead = team.members?.find(m => m.id === user?.id)?.pivot?.role === 'lead';
    return isManager && isLead;
  };

  if (loading) return <div style={styles.loading}>Loading teams…</div>;

  const availableUsers = users.filter(u => !selectedTeam?.members?.some(m => m.id === u.id));

  const ROLE_STYLES = {
    lead:        { bg: '#ede9fe', color: '#5b21b6' },
    manager:     { bg: '#dbeafe', color: '#1e40af' },
    team_member: { bg: '#f3f4f6', color: '#374151' },
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const avatarColor = (name) => {
    const colors = ['#eef2ff', '#ecfdf5', '#fef3c7', '#fce7f3', '#eff6ff'];
    const tc = ['#4f46e5', '#059669', '#d97706', '#db2777', '#2563eb'];
    const i = (name?.charCodeAt(0) || 0) % colors.length;
    return { bg: colors[i], color: tc[i] };
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Teams</h1>
          <p style={styles.subtitle}>{teams.length} team{teams.length !== 1 ? 's' : ''}</p>
        </div>
        {(isAdmin || isManager) && (
          <button onClick={() => setShowCreateModal(true)} style={styles.primaryBtn}>
            <PlusIcon style={{ width: 18, height: 18 }} />
            New Team
          </button>
        )}
      </div>

      <div style={styles.grid}>
        {teams.map((team) => {
          const ac = avatarColor(team.name);
          return (
            <div key={team.id} style={styles.teamCard}>
              <div style={styles.teamHeader}>
                <div style={styles.teamInfo}>
                  <div style={{ ...styles.teamAvatar, background: ac.bg }}>
                    <span style={{ color: ac.color, fontWeight: '700', fontSize: '0.9rem' }}>{initials(team.name)}</span>
                  </div>
                  <div>
                    <h2 style={styles.teamName}>{team.name}</h2>
                    <p style={styles.teamCreator}>Created by {team.creator?.name}</p>
                  </div>
                </div>
                {canManageTeam(team) && (
                  <button
                    onClick={() => { setSelectedTeam(team); setShowAddMemberModal(true); }}
                    style={styles.addMemberBtn}
                  >
                    <UserPlusIcon style={{ width: 15, height: 15 }} />
                    Add
                  </button>
                )}
              </div>

              <div style={styles.memberCount}>
                <span style={styles.memberCountText}>{team.members?.length || 0} member{team.members?.length !== 1 ? 's' : ''}</span>
              </div>

              <div style={styles.memberList}>
                {(!team.members || team.members.length === 0) && (
                  <p style={styles.emptyMembers}>No members yet</p>
                )}
                {team.members?.map((member) => {
                  const ma = avatarColor(member.name);
                  const role = member.pivot?.role || 'team_member';
                  const rs = ROLE_STYLES[role] || ROLE_STYLES.team_member;
                  return (
                    <div key={member.id} style={styles.memberRow}>
                      <div style={styles.memberLeft}>
                        <div style={{ ...styles.memberAvatar, background: ma.bg }}>
                          <span style={{ color: ma.color, fontWeight: '700', fontSize: '0.7rem' }}>{initials(member.name)}</span>
                        </div>
                        <div>
                          <p style={styles.memberName}>{member.name}</p>
                          <span style={{ ...styles.roleBadge, background: rs.bg, color: rs.color }}>
                            {role.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      {canManageTeam(team) && member.id !== user?.id && (
                        <button onClick={() => handleRemoveMember(team.id, member.id)} style={styles.removeBtn} title="Remove member">
                          <UserMinusIcon style={{ width: 15, height: 15 }} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {teams.length === 0 && (
        <div style={styles.empty}>
          <p style={styles.emptyTitle}>No teams yet</p>
          <p style={styles.emptyMsg}>Create your first team to start collaborating.</p>
        </div>
      )}

      {(showCreateModal || showAddMemberModal) && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {showCreateModal ? 'Create New Team' : `Add Member to ${selectedTeam?.name}`}
              </h3>
              <button onClick={() => { setShowCreateModal(false); setShowAddMemberModal(false); }} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={showCreateModal ? handleCreateTeam : handleAddMember} style={styles.modalForm}>
              {showCreateModal ? (
                <div style={styles.field}>
                  <label style={styles.label}>Team Name</label>
                  <input type="text" required style={styles.input} value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Frontend Team" />
                </div>
              ) : (
                <div style={styles.field}>
                  <label style={styles.label}>Select User</label>
                  <select required style={styles.input} value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}>
                    <option value="">Choose a user…</option>
                    {availableUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => { setShowCreateModal(false); setShowAddMemberModal(false); }} style={styles.ghostBtn}>Cancel</button>
                <button type="submit" style={styles.primaryBtn}>
                  {showCreateModal ? 'Create Team' : 'Add Member'}
                </button>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' },
  title: { fontSize: '1.65rem', fontWeight: '700', color: '#1a1830', margin: 0, letterSpacing: '-0.5px' },
  subtitle: { fontSize: '0.85rem', color: '#8b8aa0', margin: '4px 0 0' },
  primaryBtn: { background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: 'white', border: 'none', borderRadius: '10px', padding: '0.6rem 1.1rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' },
  teamCard: { background: 'white', border: '1px solid #eeecf8', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(99,102,241,0.04)' },
  teamHeader: { padding: '1.25rem 1.25rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  teamInfo: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  teamAvatar: { width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  teamName: { fontSize: '1rem', fontWeight: '700', color: '#1a1830', margin: 0 },
  teamCreator: { fontSize: '0.78rem', color: '#b0aec8', margin: '2px 0 0' },
  addMemberBtn: { background: '#f5f4fe', color: '#4f46e5', border: '1px solid #e0defb', borderRadius: '8px', padding: '5px 10px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' },
  memberCount: { padding: '0 1.25rem 0.6rem', borderBottom: '1px solid #f5f4fe' },
  memberCountText: { fontSize: '0.75rem', color: '#b0aec8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' },
  memberList: { padding: '0.25rem 0' },
  emptyMembers: { fontSize: '0.85rem', color: '#b0aec8', textAlign: 'center', padding: '1.25rem' },
  memberRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1.25rem', transition: 'background 0.1s' },
  memberLeft: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  memberAvatar: { width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  memberName: { fontSize: '0.88rem', fontWeight: '600', color: '#1a1830', margin: 0 },
  roleBadge: { fontSize: '0.7rem', fontWeight: '600', padding: '2px 7px', borderRadius: '999px', textTransform: 'capitalize' },
  removeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#d1d0e0', padding: '4px', borderRadius: '6px', display: 'flex' },
  empty: { textAlign: 'center', padding: '4rem 2rem' },
  emptyTitle: { fontSize: '1rem', fontWeight: '700', color: '#1a1830', margin: '0 0 6px' },
  emptyMsg: { fontSize: '0.85rem', color: '#8b8aa0', margin: 0 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,24,48,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal: { background: 'white', borderRadius: '18px', padding: '2rem', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  modalTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#1a1830', margin: 0 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#8b8aa0', fontSize: '1rem', fontFamily: 'inherit' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.78rem', fontWeight: '600', color: '#3d3b52', textTransform: 'uppercase', letterSpacing: '0.3px' },
  input: { padding: '0.6rem 0.8rem', border: '1.5px solid #e2e0f0', borderRadius: '9px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', background: 'white' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  ghostBtn: { background: 'none', border: '1.5px solid #e2e0f0', borderRadius: '9px', padding: '0.55rem 1rem', fontSize: '0.9rem', cursor: 'pointer', color: '#3d3b52', fontFamily: 'inherit' },
};

export default Teams;
