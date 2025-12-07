import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  List,
  CheckCircle,
  Circle,
  Clock,
  ArrowLeft,
  MessageCircle
} from 'lucide-react';
import { getJourney, getJourneyTasks, getQuestion, saveQuestionResponse, markQuestionDiscussed, getQuestionStatus } from '../api';

function JourneyReader({ user }) {
  const { journeyId } = useParams();
  const navigate = useNavigate();

  const [journey, setJourney] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentTask, setCurrentTask] = useState(null);
  const [showTOC, setShowTOC] = useState(false);
  const [loading, setLoading] = useState(true);

  // For question tasks
  const [questionData, setQuestionData] = useState(null);
  const [questionStatus, setQuestionStatus] = useState(null);
  const [myResponse, setMyResponse] = useState('');
  const [savedResponse, setSavedResponse] = useState(''); // Track what's been saved
  const [jointNotes, setJointNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    loadJourney();
  }, [journeyId]);

  useEffect(() => {
    if (tasks.length > 0) {
      loadCurrentTask();
    }
  }, [currentTaskIndex, tasks]);

  // Auto-save with debounce
  useEffect(() => {
    if (!myResponse.trim() || myResponse === savedResponse || !currentTask?.question_id) {
      return;
    }

    const timer = setTimeout(() => {
      handleAutoSave();
    }, 2000); // Auto-save after 2 seconds of no typing

    return () => clearTimeout(timer);
  }, [myResponse]);

  const loadJourney = async () => {
    try {
      const [journeyRes, tasksRes] = await Promise.all([
        getJourney(journeyId),
        getJourneyTasks(journeyId)
      ]);

      const journeyData = journeyRes.data;

      // Detect behavioral journey (has story slots instead of questions)
      const isBehavioralJourney = journeyData.title.toLowerCase().includes('interview') ||
                                   journeyData.description?.toLowerCase().includes('interview');

      if (isBehavioralJourney) {
        // Redirect to behavioral journey interface
        navigate(`/journey/${journeyId}/story-slots`);
        return;
      }

      setJourney(journeyData);
      setTasks(tasksRes.data);

      // Find first incomplete task or start at beginning
      const firstIncomplete = tasksRes.data.findIndex(t => t.status !== 'completed');
      setCurrentTaskIndex(firstIncomplete >= 0 ? firstIncomplete : 0);

      setLoading(false);
    } catch (error) {
      console.error('Error loading journey:', error);
      setLoading(false);
    }
  };

  const loadCurrentTask = async () => {
    const task = tasks[currentTaskIndex];
    if (!task) return;

    setCurrentTask(task);

    // If it's a question task, load the question details
    if (task.task_type === 'question' && task.question_id) {
      try {
        const [questionRes, statusRes] = await Promise.all([
          getQuestion(task.question_id),
          getQuestionStatus(task.question_id)
        ]);

        setQuestionData(questionRes.data);
        setQuestionStatus(statusRes.data);

        // Load existing response from question responses
        const myExisting = questionRes.data?.responses?.find(r => r.user_id === user.id);
        if (myExisting) {
          setMyResponse(myExisting.response_text);
        } else {
          setMyResponse('');
        }

        // Load existing discussion notes from status
        if (statusRes.data?.jointNotes) {
          setJointNotes(statusRes.data.jointNotes);
        } else {
          setJointNotes('');
        }
      } catch (error) {
        console.error('Error loading question:', error);
      }
    }
  };

  const handlePrevious = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
      setShowTOC(false);
    }
  };

  const handleNext = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
      setShowTOC(false);
    }
  };

  const jumpToTask = (index) => {
    setCurrentTaskIndex(index);
    // Keep TOC open so user can continue navigating
  };

  const handleAutoSave = async () => {
    if (!myResponse.trim() || !currentTask?.question_id) return;

    setSaving(true);
    try {
      await saveQuestionResponse(currentTask.question_id, myResponse);
      setSavedResponse(myResponse); // Mark this as saved
      setLastSaved(new Date());
      // Don't reload - let UI stay responsive
    } catch (error) {
      console.error('Error saving response:', error);
      // Silently fail for auto-save
    } finally {
      setSaving(false);
    }
  };

  const handleSaveResponse = async () => {
    await handleAutoSave();
  };

  const handleMarkDiscussed = async () => {
    if (!currentTask.question_id) return;

    setSaving(true);
    try {
      await markQuestionDiscussed(currentTask.question_id, jointNotes, true);
      await loadCurrentTask(); // Reload
      // Optionally move to next task
      if (currentTaskIndex < tasks.length - 1) {
        setTimeout(() => setCurrentTaskIndex(currentTaskIndex + 1), 1000);
      }
    } catch (error) {
      console.error('Error marking discussed:', error);
      alert('Error saving discussion');
    } finally {
      setSaving(false);
    }
  };

  const getTaskStatusIcon = (task) => {
    if (task.status === 'completed') {
      return <CheckCircle size={16} color="#388e3c" />;
    }
    return <Circle size={16} color="#ccc" />;
  };

  if (loading) {
    return (
      <div className="container">
        <p style={{ textAlign: 'center', color: '#757575' }}>Loading journey...</p>
      </div>
    );
  }

  if (!journey || tasks.length === 0) {
    return (
      <div className="container">
        <div className="empty-state">
          <BookOpen size={64} color="#667eea" strokeWidth={1.5} />
          <h2>Journey Not Found</h2>
          <p style={{ color: '#757575' }}>This journey doesn't exist or you haven't enrolled yet.</p>
          <button className="btn-primary" onClick={() => navigate('/journeys')}>
            Browse Journeys
          </button>
        </div>
      </div>
    );
  }

  const partnerResponse = questionData?.responses?.find(r => r.user_id !== user.id);
  const myExistingResponse = questionData?.responses?.find(r => r.user_id === user.id);
  const bothAnswered = questionStatus?.bothAnswered;
  const isDiscussed = questionStatus?.isDiscussed;

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '1rem',
        zIndex: 100
      }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <button
              onClick={() => navigate('/journeys')}
              style={{
                background: 'none',
                border: 'none',
                color: '#757575',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}
            >
              <ArrowLeft size={18} />
              Back to Library
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => setShowTOC(!showTOC)}
                style={{
                  background: showTOC ? '#667eea' : 'white',
                  color: showTOC ? 'white' : '#667eea',
                  border: '1px solid #667eea',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                <List size={16} />
                Table of Contents
              </button>

              <span style={{ color: '#757575', fontSize: '0.9rem' }}>
                Page {currentTaskIndex + 1} of {tasks.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1200px', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', gap: '2rem', position: 'relative' }}>
          {/* Table of Contents Sidebar */}
          {showTOC && (
            <div style={{
              width: '280px',
              flexShrink: 0,
              position: 'sticky',
              top: '100px',
              alignSelf: 'flex-start',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
              backgroundColor: '#f9f9f9',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#667eea' }}>
                {journey.title}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tasks.map((task, index) => (
                  <button
                    key={task.id}
                    onClick={() => jumpToTask(index)}
                    style={{
                      background: index === currentTaskIndex ? '#667eea' : 'white',
                      color: index === currentTaskIndex ? 'white' : '#333',
                      border: 'none',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    {getTaskStatusIcon(task)}
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.title || `Task ${index + 1}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Book Page */}
            <div className="card" style={{
              minHeight: '60vh',
              padding: '3rem',
              position: 'relative',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              background: 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)'
            }}>
              {/* Chapter/Page Header */}
              {currentTask?.chapter_name && (
                <div style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#999',
                  marginBottom: '0.5rem'
                }}>
                  {currentTask.chapter_name}
                </div>
              )}

              {/* Task Title */}
              <h1 style={{
                fontSize: '2rem',
                marginBottom: '1.5rem',
                color: '#667eea',
                lineHeight: '1.3'
              }}>
                {currentTask?.title}
              </h1>

              {/* Task Description */}
              {currentTask?.description && (
                <p style={{
                  fontSize: '1.1rem',
                  lineHeight: '1.8',
                  color: '#555',
                  marginBottom: '2rem'
                }}>
                  {currentTask.description}
                </p>
              )}

              {/* Question Task Content */}
              {currentTask?.task_type === 'question' && questionData && (
                <div>
                  {/* Guide Questions */}
                  {questionData.details && questionData.details.length > 0 && (
                    <div style={{
                      backgroundColor: '#f0f4ff',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      marginBottom: '2rem',
                      borderLeft: '4px solid #667eea'
                    }}>
                      <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#667eea', fontWeight: '600' }}>
                        Consider these questions:
                      </h3>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: '1.8' }}>
                        {questionData.details.map((detail) => (
                          <li key={detail.id} style={{ marginBottom: '0.5rem', color: '#555' }}>
                            {detail.detail_text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Your Response */}
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BookOpen size={20} color="#1976d2" />
                      Your Response
                    </h3>

                    {!isDiscussed ? (
                      <>
                        <textarea
                          value={myResponse}
                          onChange={(e) => setMyResponse(e.target.value)}
                          placeholder="Share your thoughts, feelings, and reflections..."
                          rows="8"
                          style={{
                            width: '100%',
                            padding: '1rem',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            marginBottom: '1rem'
                          }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                          <button
                            className="btn-primary"
                            onClick={handleSaveResponse}
                            disabled={!myResponse.trim() || myResponse === savedResponse}
                          >
                            {saving ? 'Auto-saving...' : 'Save Response'}
                          </button>
                          {myResponse !== savedResponse ? (
                            <span style={{ color: '#ff9800', fontSize: '0.9rem', fontWeight: '500' }}>
                              ⚫ Unsaved changes
                            </span>
                          ) : myExistingResponse ? (
                            <span style={{ color: '#388e3c', fontSize: '0.9rem', fontWeight: '500' }}>
                              ✓ {lastSaved ? `Saved ${new Date(lastSaved).toLocaleTimeString()}` : 'Saved'}
                            </span>
                          ) : null}
                        </div>
                        {myExistingResponse && myResponse === savedResponse && (
                          <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                            Your response is saved. Waiting for your partner...
                          </p>
                        )}
                      </>
                    ) : (
                      <div style={{
                        padding: '1rem',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '8px',
                        lineHeight: '1.6'
                      }}>
                        {myExistingResponse?.response_text}
                      </div>
                    )}
                  </div>

                  {/* Partner's Response */}
                  {partnerResponse && (
                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BookOpen size={20} color="#e91e63" />
                        Partner's Response
                      </h3>
                      <div style={{
                        padding: '1rem',
                        backgroundColor: '#fce4ec',
                        borderRadius: '8px',
                        lineHeight: '1.6'
                      }}>
                        {partnerResponse.response_text}
                      </div>
                    </div>
                  )}

                  {/* Joint Discussion */}
                  {bothAnswered && (
                    <div style={{
                      borderTop: '2px solid #667eea',
                      paddingTop: '2rem',
                      marginTop: '2rem'
                    }}>
                      <h3 style={{
                        marginBottom: '1rem',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#667eea'
                      }}>
                        <MessageCircle size={20} />
                        Joint Discussion
                      </h3>

                      {!isDiscussed && (
                        <div style={{
                          padding: '1rem',
                          backgroundColor: '#fff3e0',
                          borderRadius: '8px',
                          marginBottom: '1rem',
                          fontSize: '0.95rem',
                          color: '#e65100'
                        }}>
                          ✨ Both responses complete! Discuss this question together and record your key takeaways below.
                        </div>
                      )}

                      <textarea
                        value={jointNotes}
                        onChange={(e) => setJointNotes(e.target.value)}
                        placeholder="After discussing together, record your key takeaways, insights, or decisions..."
                        rows="6"
                        disabled={isDiscussed}
                        style={{
                          width: '100%',
                          padding: '1rem',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          marginBottom: '1rem',
                          backgroundColor: isDiscussed ? '#f5f5f5' : 'white'
                        }}
                      />

                      {!isDiscussed ? (
                        <button
                          className="btn-primary"
                          onClick={handleMarkDiscussed}
                          disabled={saving}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
                        >
                          <CheckCircle size={20} />
                          {saving ? 'Saving...' : 'Mark as Discussed & Continue'}
                        </button>
                      ) : (
                        <div style={{
                          padding: '1rem',
                          backgroundColor: '#e8f5e9',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: '#388e3c'
                        }}>
                          <CheckCircle size={20} />
                          Completed on {new Date(questionStatus.discussion.discussed_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Due Date */}
              {currentTask?.due_date && (
                <div style={{
                  position: 'absolute',
                  bottom: '2rem',
                  right: '3rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: currentTask.is_overdue ? '#f44336' : '#999'
                }}>
                  <Clock size={14} />
                  Due: {new Date(currentTask.due_date).toLocaleDateString()}
                  {currentTask.is_overdue && ' (Overdue)'}
                </div>
              )}
            </div>

            {/* Page Navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '2rem',
              gap: '1rem'
            }}>
              <button
                onClick={handlePrevious}
                disabled={currentTaskIndex === 0}
                style={{
                  background: currentTaskIndex === 0 ? '#f5f5f5' : 'white',
                  border: '1px solid #e0e0e0',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: currentTaskIndex === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: currentTaskIndex === 0 ? '#ccc' : '#667eea',
                  fontWeight: '500'
                }}
              >
                <ChevronLeft size={20} />
                Previous Page
              </button>

              <div style={{
                fontSize: '0.9rem',
                color: '#757575',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic'
              }}>
                Page {currentTaskIndex + 1} of {tasks.length}
              </div>

              <button
                onClick={handleNext}
                disabled={currentTaskIndex === tasks.length - 1}
                style={{
                  background: currentTaskIndex === tasks.length - 1 ? '#f5f5f5' : '#667eea',
                  border: '1px solid #667eea',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: currentTaskIndex === tasks.length - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: currentTaskIndex === tasks.length - 1 ? '#ccc' : 'white',
                  fontWeight: '500'
                }}
              >
                Next Page
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JourneyReader;
