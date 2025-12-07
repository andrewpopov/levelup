import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AdminJourneyList() {
  const navigate = useNavigate();
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadJourneys();
  }, []);

  const loadJourneys = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/journeys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJourneys(response.data);
    } catch (err) {
      console.error('Error loading journeys:', err);
      setError('Failed to load journeys');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (journeyId) => {
    if (!confirm('Are you sure you want to delete this journey? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/journeys/${journeyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJourneys(prev => prev.filter(j => j.id !== journeyId));
    } catch (err) {
      console.error('Error deleting journey:', err);
      alert('Failed to delete journey');
    }
  };

  const handleToggleActive = async (journey) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/admin/journeys/${journey.id}`,
        { ...journey, is_active: journey.is_active ? 0 : 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJourneys(prev =>
        prev.map(j =>
          j.id === journey.id ? { ...j, is_active: j.is_active ? 0 : 1 } : j
        )
      );
    } catch (err) {
      console.error('Error toggling journey status:', err);
      alert('Failed to update journey status');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p>Loading journeys...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '1200px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{ margin: 0 }}>Manage Journeys</h1>
        <button
          onClick={() => navigate('/admin/journeys/new')}
          style={{
            padding: '10px 20px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          <Plus size={18} />
          Create New Journey
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          marginBottom: '20px',
          color: '#c33'
        }}>
          {error}
        </div>
      )}

      {journeys.length === 0 ? (
        <div className="empty-state card" style={{
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <h3>No journeys yet</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Create your first journey to get started
          </p>
          <button
            onClick={() => navigate('/admin/journeys/new')}
            className="btn-primary"
            style={{
              padding: '10px 20px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Create Journey
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {journeys.map(journey => (
            <div key={journey.id} className="card" style={{
              padding: '20px',
              display: 'flex',
              gap: '20px'
            }}>
              {journey.cover_image_url && (
                <div style={{
                  width: '150px',
                  height: '100px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  <img
                    src={journey.cover_image_url}
                    alt={journey.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>
                      {journey.title}
                    </h3>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      fontSize: '13px',
                      color: '#666',
                      marginBottom: '10px'
                    }}>
                      <span>{journey.duration_weeks} weeks</span>
                      <span>•</span>
                      <span>{journey.cadence}</span>
                      <span>•</span>
                      <span>{journey.task_count || 0} tasks</span>
                    </div>
                  </div>

                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: journey.is_active ? '#e8f5e9' : '#f5f5f5',
                    color: journey.is_active ? '#2e7d32' : '#666'
                  }}>
                    {journey.is_active ? (
                      <>
                        <Eye size={14} />
                        Published
                      </>
                    ) : (
                      <>
                        <EyeOff size={14} />
                        Draft
                      </>
                    )}
                  </div>
                </div>

                {journey.description && (
                  <p style={{
                    margin: '0 0 15px 0',
                    color: '#666',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {journey.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => navigate(`/admin/journeys/${journey.id}/edit`)}
                    style={{
                      padding: '6px 14px',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px'
                    }}
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>

                  <button
                    onClick={() => handleToggleActive(journey)}
                    style={{
                      padding: '6px 14px',
                      background: 'transparent',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px'
                    }}
                  >
                    {journey.is_active ? (
                      <>
                        <EyeOff size={14} />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye size={14} />
                        Publish
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(journey.id)}
                    style={{
                      padding: '6px 14px',
                      background: 'transparent',
                      border: '1px solid #fcc',
                      color: '#c33',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px'
                    }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
