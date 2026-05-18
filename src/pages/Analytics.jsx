import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, color, sub }) => (
  <div style={{ ...styles.statCard, borderTop: `3px solid ${color}` }}>
    <p style={styles.statLabel}>{label}</p>
    <p style={{ ...styles.statVal, color }}>{value}</p>
    {sub && <p style={styles.statSub}>{sub}</p>}
  </div>
);

const Analytics = () => {
  const { token, isManager, isAdmin } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teams, setTeams] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  const fetchTeams = useCallback(async () => {
    try {
      const r = await axios.get(`${process.env.REACT_APP_API_URL}/teams`);
      setTeams(r.data.data);
      if (r.data.data.length > 0 && !isAdmin) setSelectedTeam(r.data.data[0].id);
    } catch (e) {}
  }, [isAdmin]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      let url;
      if (isAdmin && !selectedTeam) url = `${process.env.REACT_APP_NODE_SERVICE_URL}/api/analytics/system`;
      else if (selectedTeam) url = `${process.env.REACT_APP_NODE_SERVICE_URL}/api/analytics/team/${selectedTeam}`;
      else { setLoading(false); return; }
      const r = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setAnalytics(r.data);
    } catch (e) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, selectedTeam, token]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);
  useEffect(() => { if (selectedTeam || isAdmin) fetchAnalytics(); }, [selectedTeam, isAdmin, fetchAnalytics]);

  const handleExport = async () => {
    if (!selectedTeam) { toast.error('Select a team to export'); return; }
    setExporting(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_NODE_SERVICE_URL}/api/export/tasks`,
        { team_id: selectedTeam, format: exportFormat, filters: {} },
        { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tasks_export_${Date.now()}.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export complete');
    } catch (e) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const statusData = analytics?.summary ? [
    { name: 'Completed', value: analytics.summary.completed, color: '#10b981' },
    { name: 'In Progress', value: analytics.summary.in_progress, color: '#6366f1' },
    { name: 'Pending', value: analytics.summary.pending, color: '#f59e0b' },
    { name: 'Cancelled', value: analytics.summary.cancelled, color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

  const priorityData = analytics?.priority_distribution ? [
    { name: 'High', value: analytics.priority_distribution.high, fill: '#ef4444' },
    { name: 'Medium', value: analytics.priority_distribution.medium, fill: '#f59e0b' },
    { name: 'Low', value: analytics.priority_distribution.low, fill: '#10b981' },
  ] : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={styles.tooltip}>
          <p style={styles.tooltipLabel}>{label || payload[0].name}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ ...styles.tooltipVal, color: p.color || p.payload?.color }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) return <div style={styles.loading}>Loading analytics…</div>;

  if (!analytics && !loading) return (
    <div style={styles.empty}>
      <p style={styles.emptyTitle}>No analytics data</p>
      <p style={styles.emptyMsg}>Select a team or check back later.</p>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Analytics</h1>
          <p style={styles.subtitle}>Performance insights and task metrics</p>
        </div>
        <div style={styles.headerActions}>
          <select style={styles.selectSm} value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="xlsx">Excel</option>
          </select>
          <button onClick={handleExport} disabled={exporting} style={{ ...styles.exportBtn, opacity: exporting ? 0.7 : 1 }}>
            <ArrowDownTrayIcon style={{ width: 16, height: 16 }} />
            {exporting ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>

      {(isManager || isAdmin) && (
        <div style={styles.teamSelector}>
          <label style={styles.teamSelectorLabel}>Viewing data for</label>
          <select style={styles.teamSelect} value={selectedTeam || ''} onChange={(e) => setSelectedTeam(e.target.value || null)}>
            {isAdmin && <option value="">System-wide</option>}
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}

      {analytics?.summary && (
        <div style={styles.statsGrid}>
          <StatCard label="Total Tasks" value={analytics.summary.total_tasks} color="#6366f1" />
          <StatCard label="Completion Rate" value={`${analytics.summary.completion_rate}%`} color="#10b981" sub="of all tasks" />
          <StatCard label="Avg. Completion" value={`${analytics.summary.avg_completion_time_days}d`} color="#3b82f6" sub="average time" />
          <StatCard label="In Progress" value={analytics.summary.in_progress} color="#f59e0b" sub="active tasks" />
        </div>
      )}

      <div style={styles.chartsRow}>
        {statusData.length > 0 && (
          <div style={styles.chartCard}>
            <h2 style={styles.chartTitle}>Status Distribution</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                  dataKey="value" paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={styles.legend}>
              {statusData.map(d => (
                <div key={d.name} style={styles.legendItem}>
                  <div style={{ ...styles.legendDot, background: d.color }} />
                  <span style={styles.legendLabel}>{d.name}</span>
                  <span style={styles.legendVal}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {priorityData.length > 0 && (
          <div style={styles.chartCard}>
            <h2 style={styles.chartTitle}>Priority Distribution</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={priorityData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f4fe" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#8b8aa0' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#8b8aa0' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8f7ff' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Tasks">
                  {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {analytics?.user_performance?.length > 0 && (
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h2 style={styles.chartTitle}>Team Member Performance</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Member', 'Total Tasks', 'Completed', 'Completion Rate'].map(col => (
                    <th key={col} style={styles.th}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analytics.user_performance.map((up, i) => {
                  const rate = up.completion_rate || 0;
                  const barColor = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f5f4fe' }}>
                      <td style={styles.td}>
                        <div style={styles.memberCell}>
                          <div style={{ ...styles.memberAvatar, background: '#eef2ff' }}>
                            <span style={{ color: '#4f46e5', fontWeight: '700', fontSize: '0.72rem' }}>
                              {up.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <span style={{ fontWeight: '600', color: '#1a1830' }}>{up.name}</span>
                        </div>
                      </td>
                      <td style={styles.tdCenter}>{up.total}</td>
                      <td style={styles.tdCenter}>{up.completed}</td>
                      <td style={styles.td}>
                        <div style={styles.rateCell}>
                          <div style={styles.progressTrack}>
                            <div style={{ ...styles.progressFill, width: `${rate}%`, background: barColor }} />
                          </div>
                          <span style={{ ...styles.rateVal, color: barColor }}>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { fontFamily: "'DM Sans', 'Segoe UI', sans-serif" },
  loading: { textAlign: 'center', padding: '4rem', color: '#8b8aa0' },
  empty: { textAlign: 'center', padding: '4rem' },
  emptyTitle: { fontSize: '1rem', fontWeight: '700', color: '#1a1830', margin: '0 0 6px' },
  emptyMsg: { fontSize: '0.85rem', color: '#8b8aa0', margin: 0 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' },
  title: { fontSize: '1.65rem', fontWeight: '700', color: '#1a1830', margin: 0, letterSpacing: '-0.5px' },
  subtitle: { fontSize: '0.85rem', color: '#8b8aa0', margin: '4px 0 0' },
  headerActions: { display: 'flex', gap: '8px', alignItems: 'center' },
  selectSm: { padding: '0.5rem 0.75rem', border: '1.5px solid #e2e0f0', borderRadius: '9px', fontSize: '0.85rem', fontFamily: 'inherit', background: 'white', color: '#3d3b52' },
  exportBtn: { background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: 'white', border: 'none', borderRadius: '9px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' },
  teamSelector: { background: 'white', border: '1px solid #eeecf8', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' },
  teamSelectorLabel: { fontSize: '0.85rem', fontWeight: '600', color: '#3d3b52', whiteSpace: 'nowrap' },
  teamSelect: { border: '1.5px solid #e2e0f0', borderRadius: '9px', padding: '0.45rem 0.75rem', fontSize: '0.9rem', fontFamily: 'inherit', background: 'white', color: '#1a1830', flex: '0 0 auto', minWidth: '200px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  statCard: { background: 'white', border: '1px solid #eeecf8', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(99,102,241,0.04)' },
  statLabel: { fontSize: '0.78rem', color: '#8b8aa0', margin: '0 0 4px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.3px' },
  statVal: { fontSize: '2rem', fontWeight: '700', margin: 0, letterSpacing: '-0.5px', lineHeight: 1 },
  statSub: { fontSize: '0.75rem', color: '#b0aec8', margin: '4px 0 0' },
  chartsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' },
  chartCard: { background: 'white', border: '1px solid #eeecf8', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(99,102,241,0.04)' },
  chartTitle: { fontSize: '0.78rem', fontWeight: '700', color: '#8b8aa0', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 1rem' },
  legend: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '0.75rem', justifyContent: 'center' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '5px' },
  legendDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  legendLabel: { fontSize: '0.78rem', color: '#8b8aa0' },
  legendVal: { fontSize: '0.78rem', fontWeight: '700', color: '#1a1830' },
  tooltip: { background: 'white', border: '1px solid #eeecf8', borderRadius: '10px', padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
  tooltipLabel: { fontSize: '0.8rem', fontWeight: '700', color: '#1a1830', margin: '0 0 4px' },
  tooltipVal: { fontSize: '0.8rem', margin: 0, fontWeight: '600' },
  tableCard: { background: 'white', border: '1px solid #eeecf8', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(99,102,241,0.04)' },
  tableHeader: { padding: '1.25rem 1.5rem', borderBottom: '1px solid #f5f4fe' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '0.65rem 1.5rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#b0aec8', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#fafaf9', borderBottom: '1px solid #f5f4fe' },
  td: { padding: '0.85rem 1.5rem', fontSize: '0.88rem', color: '#3d3b52', verticalAlign: 'middle' },
  tdCenter: { padding: '0.85rem 1.5rem', fontSize: '0.88rem', color: '#3d3b52', textAlign: 'center', fontWeight: '600' },
  memberCell: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  memberAvatar: { width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rateCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  progressTrack: { flex: 1, height: '6px', background: '#f1f0f9', borderRadius: '999px', overflow: 'hidden', maxWidth: '120px' },
  progressFill: { height: '100%', borderRadius: '999px', transition: 'width 0.3s' },
  rateVal: { fontSize: '0.82rem', fontWeight: '700', minWidth: '36px' },
};

export default Analytics;
