import { X, Book, Clock, Calendar } from 'lucide-react';

export default function JourneyPreview({ journey, onClose }) {
  const tasksByChapter = journey.tasks?.reduce((acc, task) => {
    const chapter = task.chapter_name || 'Main';
    if (!acc[chapter]) {
      acc[chapter] = [];
    }
    acc[chapter].push(task);
    return acc;
  }, {}) || {};

  const getCadenceDisplay = (cadence) => {
    const displays = {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Every 2 weeks',
      monthly: 'Monthly'
    };
    return displays[cadence] || cadence;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        <div style={{
          position: 'sticky',
          top: 0,
          background: 'white',
          borderBottom: '1px solid #eee',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10
        }}>
          <h2 style={{ margin: 0 }}>Journey Preview</h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '30px' }}>
          {/* Journey Header */}
          {journey.cover_image_url && (
            <div style={{
              width: '100%',
              height: '200px',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              <img
                src={journey.cover_image_url}
                alt={journey.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          <h1 style={{ marginTop: 0, marginBottom: '15px', fontSize: '32px' }}>
            {journey.title}
          </h1>

          <div style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#666'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} />
              <span>{journey.duration_weeks} weeks</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} />
              <span>{getCadenceDisplay(journey.cadence)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Book size={16} />
              <span>{journey.tasks?.length || 0} tasks</span>
            </div>
          </div>

          {journey.description && (
            <p style={{
              fontSize: '16px',
              lineHeight: '1.6',
              color: '#444',
              marginBottom: '30px'
            }}>
              {journey.description}
            </p>
          )}

          <div style={{
            padding: '12px',
            background: journey.is_active ? '#e8f5e9' : '#fff3e0',
            border: `1px solid ${journey.is_active ? '#c8e6c9' : '#ffe0b2'}`,
            borderRadius: '6px',
            marginBottom: '30px',
            fontSize: '14px',
            color: journey.is_active ? '#2e7d32' : '#e65100'
          }}>
            {journey.is_active
              ? '✓ This journey is published and visible to users'
              : '⚠ This journey is a draft and not visible to users'}
          </div>

          {/* Journey Content */}
          <div>
            <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>Journey Content</h3>

            {Object.keys(tasksByChapter).length === 0 ? (
              <div className="empty-state" style={{
                padding: '40px',
                textAlign: 'center',
                background: '#f9f9f9',
                borderRadius: '8px',
                color: '#999'
              }}>
                <p>No tasks have been added to this journey yet.</p>
              </div>
            ) : (
              Object.entries(tasksByChapter).map(([chapter, tasks]) => (
                <div key={chapter} style={{ marginBottom: '30px' }}>
                  {Object.keys(tasksByChapter).length > 1 && (
                    <h4 style={{
                      margin: '0 0 15px 0',
                      fontSize: '18px',
                      color: 'var(--primary)',
                      borderBottom: '2px solid var(--primary)',
                      paddingBottom: '8px'
                    }}>
                      {chapter}
                    </h4>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {tasks
                      .sort((a, b) => a.task_order - b.task_order)
                      .map((task, index) => (
                        <div
                          key={task.id}
                          style={{
                            padding: '16px',
                            background: 'white',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px'
                          }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'var(--primary)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              flexShrink: 0
                            }}>
                              {task.task_order + 1}
                            </div>

                            <div style={{ flex: 1 }}>
                              <h5 style={{
                                margin: '0 0 8px 0',
                                fontSize: '16px',
                                fontWeight: 600
                              }}>
                                {task.title}
                              </h5>

                              {task.description && (
                                <p style={{
                                  margin: '0 0 10px 0',
                                  color: '#666',
                                  fontSize: '14px',
                                  lineHeight: '1.5'
                                }}>
                                  {task.description}
                                </p>
                              )}

                              <div style={{
                                display: 'flex',
                                gap: '12px',
                                fontSize: '12px',
                                color: '#999'
                              }}>
                                <span style={{
                                  background: '#f0f0f0',
                                  padding: '3px 8px',
                                  borderRadius: '4px'
                                }}>
                                  {task.task_type}
                                </span>
                                {task.estimated_time_minutes && (
                                  <span style={{
                                    background: '#f0f0f0',
                                    padding: '3px 8px',
                                    borderRadius: '4px'
                                  }}>
                                    {task.estimated_time_minutes} min
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Preview Footer */}
          <div style={{
            marginTop: '40px',
            padding: '20px',
            background: '#f9f9f9',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
              This is how your journey will appear to users
            </p>
            <button
              onClick={onClose}
              className="btn-primary"
              style={{
                padding: '10px 24px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
