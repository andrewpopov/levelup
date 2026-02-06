import { useState, useEffect } from 'react';
import { Shield, Users, Settings, ToggleLeft, ToggleRight, UserCheck, UserX } from 'lucide-react';
import {
  getAdminUsers,
  getAdminSettings,
  updateAdminSetting,
  toggleUserActive,
  addUserRole
} from '../api';

function AdminDashboard({ user }) {
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, settingsRes] = await Promise.all([
        getAdminUsers(),
        getAdminSettings()
      ]);
      setUsers(usersRes.data);
      setSettings(settingsRes.data);
    } catch (err) {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSignups = async () => {
    const current = settings.find(s => s.key === 'allow_signups');
    const newValue = current?.value === 'true' ? 'false' : 'true';
    try {
      await updateAdminSetting('allow_signups', newValue);
      setSettings(settings.map(s =>
        s.key === 'allow_signups' ? { ...s, value: newValue } : s
      ));
    } catch (err) {
      setError('Failed to update setting');
    }
  };

  const handleToggleUserActive = async (userId, currentActive) => {
    try {
      await toggleUserActive(userId, !currentActive);
      setUsers(users.map(u =>
        u.id === userId ? { ...u, is_active: !currentActive ? 1 : 0 } : u
      ));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user status');
    }
  };

  const handleAddAdmin = async (userId) => {
    try {
      await addUserRole(userId, 'admin');
      setUsers(users.map(u =>
        u.id === userId ? { ...u, roles: u.roles ? u.roles + ',admin' : 'admin' } : u
      ));
    } catch (err) {
      setError('Failed to add role');
    }
  };

  const signupsAllowed = settings.find(s => s.key === 'allow_signups')?.value === 'true';

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading admin panel...</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        <Shield size={28} color="#e91e63" />
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>dismiss</button>
        </div>
      )}

      {/* Settings Section */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Settings size={20} />
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Settings</h2>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 0',
          borderBottom: '1px solid #eee'
        }}>
          <div>
            <div style={{ fontWeight: 500 }}>Allow New Signups</div>
            <div style={{ fontSize: '0.85rem', color: '#757575' }}>
              When disabled, no new accounts can be created (email or Google)
            </div>
          </div>
          <button
            onClick={handleToggleSignups}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center'
            }}
            title={signupsAllowed ? 'Click to disable' : 'Click to enable'}
          >
            {signupsAllowed ?
              <ToggleRight size={32} color="#4caf50" /> :
              <ToggleLeft size={32} color="#999" />
            }
          </button>
        </div>
      </div>

      {/* Users Section */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Users size={20} />
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Users ({users.length})</h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>User</th>
                <th style={{ padding: '0.5rem' }}>Created</th>
                <th style={{ padding: '0.5rem' }}>Last Login</th>
                <th style={{ padding: '0.5rem' }}>Roles</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isCurrentUser = u.id === user?.id;
                const isActive = u.is_active !== 0;
                const roles = u.roles ? u.roles.split(',') : [];
                const isAdmin = roles.includes('admin');

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '0.5rem' }}>
                      <div style={{ fontWeight: 500 }}>{u.displayName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#999' }}>
                        {u.username}
                        {u.google_id ? ' (Google)' : ''}
                      </div>
                    </td>
                    <td style={{ padding: '0.5rem', color: '#757575' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ padding: '0.5rem', color: '#757575' }}>
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      {roles.length > 0 ? (
                        roles.map(r => (
                          <span key={r} style={{
                            display: 'inline-block',
                            background: r === 'admin' ? '#e91e63' : '#2196f3',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            marginRight: '4px'
                          }}>
                            {r}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: '#999', fontSize: '0.8rem' }}>user</span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      {isActive ?
                        <span style={{ color: '#4caf50', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <UserCheck size={14} /> Active
                        </span> :
                        <span style={{ color: '#f44336', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <UserX size={14} /> Disabled
                        </span>
                      }
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {!isCurrentUser && (
                          <button
                            onClick={() => handleToggleUserActive(u.id, isActive)}
                            style={{
                              background: isActive ? '#ff5722' : '#4caf50',
                              color: '#fff',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            {isActive ? 'Disable' : 'Enable'}
                          </button>
                        )}
                        {!isAdmin && (
                          <button
                            onClick={() => handleAddAdmin(u.id)}
                            style={{
                              background: '#9c27b0',
                              color: '#fff',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            Make Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
