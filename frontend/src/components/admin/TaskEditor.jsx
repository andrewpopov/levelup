import { useState } from 'react';
import { GripVertical, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

export default function TaskEditor({ tasks, onAddTask, onUpdateTask, onDeleteTask, onReorderTasks }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'task',
    estimated_time_minutes: 15,
    chapter_name: ''
  });
  const [draggedIndex, setDraggedIndex] = useState(null);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      task_type: 'task',
      estimated_time_minutes: 15,
      chapter_name: ''
    });
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      alert('Task title is required');
      return;
    }

    if (editingTaskId) {
      const task = tasks.find(t => t.id === editingTaskId);
      await onUpdateTask(editingTaskId, {
        ...formData,
        task_order: task.task_order
      });
      setEditingTaskId(null);
    } else {
      await onAddTask(formData);
      setShowAddForm(false);
    }
    resetForm();
  };

  const handleEdit = (task) => {
    setFormData({
      title: task.title,
      description: task.description || '',
      task_type: task.task_type || 'task',
      estimated_time_minutes: task.estimated_time_minutes || 15,
      chapter_name: task.chapter_name || ''
    });
    setEditingTaskId(task.id);
    setShowAddForm(false);
  };

  const handleDelete = async (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await onDeleteTask(taskId);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const reordered = [...tasks];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, draggedItem);

    // Update task_order for all tasks
    const updatedTasks = reordered.map((task, index) => ({
      ...task,
      task_order: index
    }));

    onReorderTasks(updatedTasks);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Journey Tasks</h2>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingTaskId(null);
            resetForm();
          }}
          style={{
            padding: '8px 16px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      {(showAddForm || editingTaskId) && (
        <div style={{
          padding: '20px',
          background: '#f9f9f9',
          border: '2px solid var(--primary)',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0 }}>
            {editingTaskId ? 'Edit Task' : 'Add New Task'}
          </h3>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
              Task Title <span style={{ color: 'var(--primary)' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Week 1: First Conversation"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this task involves..."
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                Task Type
              </label>
              <select
                value={formData.task_type}
                onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="task">Task</option>
                <option value="question">Question</option>
                <option value="reflection">Reflection</option>
                <option value="exercise">Exercise</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                Estimated Time (min)
              </label>
              <input
                type="number"
                value={formData.estimated_time_minutes}
                onChange={(e) => setFormData({ ...formData, estimated_time_minutes: parseInt(e.target.value) || 0 })}
                min="0"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                Chapter
              </label>
              <input
                type="text"
                value={formData.chapter_name}
                onChange={(e) => setFormData({ ...formData, chapter_name: e.target.value })}
                placeholder="Optional"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSubmit}
              style={{
                padding: '8px 20px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Save size={16} />
              {editingTaskId ? 'Update Task' : 'Add Task'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingTaskId(null);
                resetForm();
              }}
              style={{
                padding: '8px 20px',
                background: 'transparent',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <p>No tasks yet. Click "Add Task" to create your first task.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks
            .sort((a, b) => a.task_order - b.task_order)
            .map((task, index) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                style={{
                  padding: '15px',
                  background: draggedIndex === index ? '#f0f0f0' : 'white',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'move',
                  opacity: draggedIndex === index ? 0.5 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <GripVertical size={20} style={{ color: '#999', marginTop: '2px', flexShrink: 0 }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '12px',
                        background: '#e0e0e0',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 500
                      }}>
                        #{index + 1}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '16px' }}>{task.title}</h4>
                    </div>

                    {task.description && (
                      <p style={{ margin: '6px 0', color: '#666', fontSize: '14px' }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#999', marginTop: '8px' }}>
                      <span>Type: {task.task_type}</span>
                      {task.estimated_time_minutes && (
                        <span>Time: {task.estimated_time_minutes} min</span>
                      )}
                      {task.chapter_name && (
                        <span>Chapter: {task.chapter_name}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleEdit(task)}
                      style={{
                        padding: '6px',
                        background: 'transparent',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Edit task"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      style={{
                        padding: '6px',
                        background: 'transparent',
                        border: '1px solid #fcc',
                        color: '#c33',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {tasks.length > 0 && (
        <p style={{ marginTop: '15px', fontSize: '13px', color: '#999', textAlign: 'center' }}>
          Drag and drop tasks to reorder them
        </p>
      )}
    </div>
  );
}
