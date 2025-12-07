import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TaskEditor from './TaskEditor';
import JourneyPreview from './JourneyPreview';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function JourneyBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [journey, setJourney] = useState({
    title: '',
    description: '',
    cover_image_url: '',
    duration_weeks: 4,
    cadence: 'weekly',
    is_active: 0
  });

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      loadJourney();
    }
  }, [id]);

  const loadJourney = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const journeyResponse = await axios.get(`${API_URL}/api/journeys/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setJourney({
        title: journeyResponse.data.title,
        description: journeyResponse.data.description,
        cover_image_url: journeyResponse.data.cover_image_url,
        duration_weeks: journeyResponse.data.duration_weeks,
        cadence: journeyResponse.data.cadence,
        is_active: journeyResponse.data.is_active
      });

      setTasks(journeyResponse.data.tasks || []);
    } catch (err) {
      console.error('Error loading journey:', err);
      setError('Failed to load journey');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setJourney(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleSaveJourney = async () => {
    try {
      setSaving(true);
      setError('');

      if (!journey.title || !journey.duration_weeks || !journey.cadence) {
        setError('Please fill in all required fields');
        return;
      }

      const token = localStorage.getItem('token');
      const method = isEditMode ? 'put' : 'post';
      const url = isEditMode
        ? `${API_URL}/api/admin/journeys/${id}`
        : `${API_URL}/api/admin/journeys`;

      const response = await axios({
        method,
        url,
        headers: { Authorization: `Bearer ${token}` },
        data: journey
      });

      const journeyId = response.data.id;

      // If new journey, redirect to edit mode
      if (!isEditMode) {
        navigate(`/admin/journeys/${journeyId}/edit`);
      } else {
        alert('Journey saved successfully!');
      }
    } catch (err) {
      console.error('Error saving journey:', err);
      setError(err.response?.data?.error || 'Failed to save journey');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async (taskData) => {
    try {
      if (!id) {
        setError('Please save the journey first before adding tasks');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/admin/journeys/${id}/tasks`,
        { ...taskData, task_order: tasks.length },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTasks(prev => [...prev, response.data]);
    } catch (err) {
      console.error('Error adding task:', err);
      setError(err.response?.data?.error || 'Failed to add task');
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/admin/journeys/${id}/tasks/${taskId}`,
        taskData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTasks(prev => prev.map(t => t.id === taskId ? response.data : t));
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/api/admin/journeys/${id}/tasks/${taskId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleReorderTasks = async (reorderedTasks) => {
    try {
      const token = localStorage.getItem('token');

      // Update local state immediately
      setTasks(reorderedTasks);

      // Send to server
      const tasksToUpdate = reorderedTasks.map((task, index) => ({
        id: task.id,
        task_order: index
      }));

      await axios.put(
        `${API_URL}/api/admin/journeys/${id}/tasks/reorder`,
        { tasks: tasksToUpdate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Error reordering tasks:', err);
      setError(err.response?.data?.error || 'Failed to reorder tasks');
      // Reload tasks to revert to server state
      loadJourney();
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p>Loading journey...</p>
      </div>
    );
  }

  if (showPreview) {
    return (
      <JourneyPreview
        journey={{ ...journey, id, tasks }}
        onClose={() => setShowPreview(false)}
      />
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>
          {isEditMode ? 'Edit Journey' : 'Create New Journey'}
        </h1>
        <button
          onClick={() => navigate('/admin/journeys')}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to List
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

      <div className="card" style={{ marginBottom: '30px' }}>
        <h2 style={{ marginTop: 0 }}>Journey Details</h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Title <span style={{ color: 'var(--primary)' }}>*</span>
          </label>
          <input
            type="text"
            name="title"
            value={journey.title}
            onChange={handleInputChange}
            placeholder="e.g., A Year of Conversations"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Description
          </label>
          <textarea
            name="description"
            value={journey.description}
            onChange={handleInputChange}
            placeholder="Describe what this journey is about..."
            rows={4}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Cover Image URL
          </label>
          <input
            type="text"
            name="cover_image_url"
            value={journey.cover_image_url}
            onChange={handleInputChange}
            placeholder="https://example.com/image.jpg"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Duration (weeks) <span style={{ color: 'var(--primary)' }}>*</span>
            </label>
            <input
              type="number"
              name="duration_weeks"
              value={journey.duration_weeks}
              onChange={handleInputChange}
              min="1"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Cadence <span style={{ color: 'var(--primary)' }}>*</span>
            </label>
            <select
              name="cadence"
              value={journey.cadence}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="is_active"
              checked={journey.is_active === 1}
              onChange={handleInputChange}
              style={{ marginRight: '8px' }}
            />
            <span>Publish (make visible to users)</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSaveJourney}
            disabled={saving}
            className="btn-primary"
            style={{
              padding: '12px 24px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save Journey'}
          </button>

          {isEditMode && tasks.length > 0 && (
            <button
              onClick={() => setShowPreview(true)}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid var(--primary)',
                color: 'var(--primary)',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Preview
            </button>
          )}
        </div>
      </div>

      {isEditMode && (
        <TaskEditor
          tasks={tasks}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onReorderTasks={handleReorderTasks}
        />
      )}
    </div>
  );
}
