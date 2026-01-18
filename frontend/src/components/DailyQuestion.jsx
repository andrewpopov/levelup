import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, User, Users, CheckCircle, ArrowLeft, Sparkles } from 'lucide-react';
import {
  getTodaysPrompt,
  getQuestionStatus,
  saveQuestionResponse,
  markQuestionDiscussed
} from '../api';

function DailyQuestion({ user }) {
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [status, setStatus] = useState(null);
  const [myResponse, setMyResponse] = useState('');
  const [savedResponse, setSavedResponse] = useState(''); // Track what's been saved
  const [jointNotes, setJointNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [currentStep, setCurrentStep] = useState('respond'); // 'respond', 'review', 'discuss'

  useEffect(() => {
    loadQuestion();
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    if (!question || !myResponse.trim() || myResponse === savedResponse) {
      return;
    }

    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        await saveQuestionResponse(question.id, myResponse);
        setSavedResponse(myResponse);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Error auto-saving response:', error);
      } finally {
        setSaving(false);
      }
    }, 2000); // Auto-save after 2 seconds of no typing

    return () => clearTimeout(timer);
  }, [myResponse, question, savedResponse]);

  const loadQuestion = async () => {
    try {
      const [questionRes, statusRes] = await Promise.all([
        getTodaysPrompt(),
        getTodaysPrompt().then(q => getQuestionStatus(q.data.id))
      ]);

      setQuestion(questionRes.data);
      setStatus(statusRes.data);

      // Set my existing response if any (from question data, not status)
      const myExistingResponse = questionRes.data.responses?.find(r => r.user_id === user.id);
      if (myExistingResponse) {
        setMyResponse(myExistingResponse.response_text);
      }

      // Set joint notes if already discussed
      if (statusRes.data.jointNotes) {
        setJointNotes(statusRes.data.jointNotes);
      }

      // Determine current step
      if (statusRes.data.isDiscussed) {
        setCurrentStep('completed');
      } else if (statusRes.data.answeredCount === 2) {
        setCurrentStep('discuss');
      } else if (myExistingResponse) {
        setCurrentStep('review');
      } else {
        setCurrentStep('respond');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading question:', error);
      setLoading(false);
    }
  };

  const handleAutoSave = async () => {
    if (!myResponse.trim() || !question) return;

    setSaving(true);
    try {
      await saveQuestionResponse(question.id, myResponse);
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
    setSaving(true);
    try {
      await markQuestionDiscussed(question.id, jointNotes, true);
      await loadQuestion(); // Reload to show completion
    } catch (error) {
      console.error('Error marking as discussed:', error);
      alert('Error saving discussion. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p style={{ textAlign: 'center', color: '#757575' }}>Loading today's question...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="container">
        <div className="empty-state">
          <MessageCircle size={64} color="#667eea" strokeWidth={1.5} style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>No Question Available</h2>
          <p style={{ color: '#757575' }}>Check back later for your next question!</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const partnerResponse = question?.responses?.find(r => r.user_id !== user.id);
  const myExistingResponse = question?.responses?.find(r => r.user_id === user.id);
  const bothAnswered = status?.bothAnswered;
  const isDiscussed = status?.isDiscussed;

  return (
    <div className="container">
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'none',
          border: 'none',
          color: '#757575',
          cursor: 'pointer',
          padding: '0.5rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.95rem'
        }}
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>

      {/* Progress Indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <div style={{
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          backgroundColor: currentStep !== 'respond' ? '#e8f5e9' : '#e3f2fd',
          color: currentStep !== 'respond' ? '#388e3c' : '#1976d2',
          fontSize: '0.85rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {currentStep !== 'respond' ? <CheckCircle size={16} /> : <User size={16} />}
          1. Your Response
        </div>
        <div style={{
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          backgroundColor: bothAnswered || isDiscussed ? '#e8f5e9' : '#f5f5f5',
          color: bothAnswered || isDiscussed ? '#388e3c' : '#999',
          fontSize: '0.85rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {bothAnswered || isDiscussed ? <CheckCircle size={16} /> : <Users size={16} />}
          2. Partner Response
        </div>
        <div style={{
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          backgroundColor: isDiscussed ? '#e8f5e9' : '#f5f5f5',
          color: isDiscussed ? '#388e3c' : '#999',
          fontSize: '0.85rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {isDiscussed ? <CheckCircle size={16} /> : <MessageCircle size={16} />}
          3. Discussion
        </div>
      </div>

      {/* Question Card */}
      <div className="card" style={{
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', opacity: 0.9 }}>
          <MessageCircle size={20} />
          <span style={{ fontSize: '0.85rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Week {question.week_number} • {question.category_name}
          </span>
        </div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>{question.title}</h1>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', opacity: 0.95 }}>
          {question.main_prompt}
        </p>
        {question.details && question.details.length > 0 && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.75rem', opacity: 0.9 }}>
              Consider these questions:
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: '1.8' }}>
              {question.details.map((detail) => (
                <li key={detail.id} style={{ opacity: 0.95 }}>
                  {detail.detail_text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Step 1: Your Response */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <User size={20} color="#1976d2" />
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Your Response</h2>
          {myExistingResponse && (
            <span style={{
              marginLeft: 'auto',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              backgroundColor: '#e8f5e9',
              color: '#388e3c',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}>
              Saved
            </span>
          )}
        </div>

        {currentStep === 'respond' || currentStep === 'review' ? (
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
              <p style={{ marginTop: '0.5rem', color: '#757575', fontSize: '0.9rem' }}>
                Your response is saved. Waiting for your partner to respond...
              </p>
            )}
          </>
        ) : (
          <div style={{
            padding: '1rem',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            lineHeight: '1.6'
          }}>
            {myExistingResponse?.response_text}
          </div>
        )}
      </div>

      {/* Step 2: Partner's Response */}
      {partnerResponse && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <User size={20} color="#e91e63" />
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Partner's Response</h2>
            <span style={{
              marginLeft: 'auto',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              backgroundColor: '#e8f5e9',
              color: '#388e3c',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}>
              Received
            </span>
          </div>
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

      {/* Step 3: Discussion */}
      {bothAnswered && (
        <div className="card" style={{
          marginBottom: '2rem',
          borderLeft: '4px solid #667eea'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <MessageCircle size={20} color="#667eea" />
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Joint Discussion</h2>
            {isDiscussed && (
              <span style={{
                marginLeft: 'auto',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                backgroundColor: '#e8f5e9',
                color: '#388e3c',
                fontSize: '0.75rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <CheckCircle size={12} />
                Completed
              </span>
            )}
          </div>

          {!isDiscussed && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#fff3e0',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'start',
              gap: '0.75rem'
            }}>
              <Sparkles size={20} color="#f57c00" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500', color: '#f57c00' }}>
                  Ready to discuss together!
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: '1.5' }}>
                  Now that you've both shared your individual responses, take time to discuss this question together.
                  Share what you learned about each other and record your key takeaways below.
                </p>
              </div>
            </div>
          )}

          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#666' }}>
            Discussion Notes & Takeaways
          </label>
          <textarea
            value={jointNotes}
            onChange={(e) => setJointNotes(e.target.value)}
            placeholder="After discussing together, record your key takeaways, insights, or decisions you made..."
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

          {!isDiscussed && (
            <button
              className="btn-primary"
              onClick={handleMarkDiscussed}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
            >
              <CheckCircle size={20} />
              {saving ? 'Saving...' : 'Mark as Discussed & Save'}
            </button>
          )}

          {isDiscussed && (
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
              <span>
                Completed on {new Date(status.discussion.discussed_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Call to Action */}
      {isDiscussed && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ color: '#757575', marginBottom: '1rem' }}>
            Great work! This conversation has been added to your Journey Book.
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate('/journey-book')}
            style={{ marginRight: '1rem' }}
          >
            View Journey Book
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

export default DailyQuestion;
