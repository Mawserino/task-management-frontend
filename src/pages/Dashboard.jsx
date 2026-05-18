import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const STATUS_STYLES = {
  completed: { bg: '#ecfdf5', color: '#065f46', label: 'Completed' },
  in_progress: { bg: '#eff6ff', color: '#1e40af', label: 'In Progress' },
  pending: { bg: '#fefce8', color: '#92400e', label: 'Pending' },
  cancelled: { bg: '#fef2f2', color: '#991b1b', label: 'Cancelled' },
};

const Dashboard = () => {
  const { user, token, isManager } = useAuth();
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, pending: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const tasksResponse = await axios.get(`${process.env.REACT_APP_API_URL}/tasks`, { params: { per_page: 10 } });
      const tasks = tasksResponse.data.data;
      setStats({
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        pending: tasks.filter(t => t.status === 'pending').length,
      });
      setRecentTasks(tasks.slice(0, 5));
      if (isManager && user?.teams?.[0]) {
        const analyticsResponse = await axios.get(
          `${process.env.REACT_APP_NODE_SERVICE_URL}/api/analytics/team/${user.teams[0].id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAnalytics(analyticsResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [isManager, token, user?.teams]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const statCards = [
    { name: 'Total Tasks', value: stats.total, icon: ClipboardDocumentListIcon, accent: '#6366f1', bg: '#eef2ff' },
    { name: 'Completed', value: stats.completed, icon: CheckCircleIcon, accent: '#059669', bg: '#ecfdf5' },
    { name: 'In Progress', value: stats.inProgress, icon: ClockIcon, accent: '#d97706', bg: '#fef3c7' },
    { name: 'Pending', value: stats.pending, icon: ExclamationTriangleIcon, accent: '#dc2626', bg: '#fef2f2' },
  ];

  const chartData = analytics?.user_performance?.map(up => ({
    name: up.name.split(' ')[0],
    tasks: up.total,
    completed: up.completed,
  })) || [];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div style={styles.loadWrap}>
        <div style={styles.loadDot} />
        <span style={styles.loadText}>Loading dashboard…</span>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.greeting}>{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p style={styles.subGreeting}>Here's a snapshot of your work today.</p>
        </div>
        <div style={styles.dateBadge}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div style={styles.statsGrid}>
        {statCards.map(({ name, value, icon: Icon, accent, bg }) => (
          <div key={name} style={styles.statCard}>
            <div style={{ ...styles.iconWrap, background: bg }}>
              <Icon style={{ width: 22, height: 22, color: accent }} />
            </div>
            <div>
              <p style={styles.statLabel}>{name}</p>
              <p style={{ ...styles.statVal, color: accent }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.contentGrid}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Recent Tasks</h2>
            <span style={styles.panelCount}>{recentTasks.length} tasks</span>
          </div>
          <div>
            {recentTasks.length === 0 && (
              <p style={styles.emptyMsg}>No tasks yet.</p>
            )}
            {recentTasks.map((task) => {
              const s = STATUS_STYLES[task.status] || STATUS_STYLES.pending;
              return (
                <div key={task.id} style={styles.taskRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={styles.taskTitle}>{task.title}</p>
                    <p style={styles.taskMeta}>
                      {task.assigned_user?.name && `Assigned to ${task.assigned_user.name}`}
                    </p>
                  </div>
                  <span style={{ ...styles.badge, background: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {analytics && chartData.length > 0 && (
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Team Performance</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f0f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8b8aa0' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#8b8aa0' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #eeecf8', fontSize: 13 }}
                  cursor={{ fill: '#f5f4fe' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="tasks" fill="#c7d2fe" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { padding: '0.5rem 0', fontFamily: "'DM Sans', 'Segoe UI', sans-serif" },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  greeting: { fontSize: '1.65rem', fontWeight: '700', color: '#1a1830', margin: 0, letterSpacing: '-0.5px' },
  subGreeting: { fontSize: '0.9rem', color: '#8b8aa0', margin: '4px 0 0' },
  dateBadge: {
    background: '#f5f4fe',
    color: '#6366f1',
    padding: '0.4rem 0.85rem',
    borderRadius: '999px',
    fontSize: '0.82rem',
    fontWeight: '600',
    border: '1px solid #e2e0f0',
    whiteSpace: 'nowrap',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
    marginBottom: '1.75rem',
  },
  statCard: {
    background: 'white',
    border: '1px solid #eeecf8',
    borderRadius: '14px',
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: '0 1px 4px rgba(99,102,241,0.05)',
  },
  iconWrap: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statLabel: { fontSize: '0.78rem', color: '#8b8aa0', margin: '0 0 4px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.3px' },
  statVal: { fontSize: '1.85rem', fontWeight: '700', margin: 0, lineHeight: 1 },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.25rem',
  },
  panel: {
    background: 'white',
    border: '1px solid #eeecf8',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 1px 4px rgba(99,102,241,0.05)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  panelTitle: { fontSize: '1rem', fontWeight: '700', color: '#1a1830', margin: 0 },
  panelCount: { fontSize: '0.78rem', color: '#8b8aa0', background: '#f5f4fe', padding: '3px 10px', borderRadius: '999px', fontWeight: '600' },
  taskRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.7rem 0',
    borderBottom: '1px solid #f5f4fe',
  },
  taskTitle: { fontSize: '0.9rem', fontWeight: '600', color: '#1a1830', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  taskMeta: { fontSize: '0.78rem', color: '#b0aec8', margin: '3px 0 0' },
  badge: {
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '0.72rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  emptyMsg: { color: '#b0aec8', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem 0' },
  loadWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '10px' },
  loadDot: { width: 10, height: 10, borderRadius: '50%', background: '#6366f1', animation: 'pulse 1s infinite' },
  loadText: { color: '#8b8aa0', fontSize: '0.9rem' },
};

export default Dashboard;
