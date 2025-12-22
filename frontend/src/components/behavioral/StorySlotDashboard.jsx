import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Play, CheckCircle2, Lock, TrendingUp, ArrowRight } from 'lucide-react';
import { getJourney, getJourneyStoryProgress, getJourneySignalCoverage } from '../../api';

function StorySlotDashboard() {
  const { journeyId } = useParams();
  const navigate = useNavigate();
  const [journey, setJourney] = useState(null);
  const [slotProgress, setSlotProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signalCoverage, setSignalCoverage] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, [journeyId]);

  const loadDashboardData = async () => {
    try {
      // Get journey details
      const journeyRes = await getJourney(journeyId);
      setJourney(journeyRes.data);

      // Get story slot progress
      const progressRes = await getJourneyStoryProgress(journeyId);
      setSlotProgress(progressRes.data);

      // Get signal coverage
      const coverageRes = await getJourneySignalCoverage(journeyId);
      setSignalCoverage(coverageRes.data);

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const getSignalBadges = (signals) => {
    if (!signals) return [];
    return signals.slice(0, 2).map(signal => (
      <span
        key={signal}
        style={{
          display: 'inline-block',
          fontSize: '0.75rem',
          padding: '0.25rem 0.5rem',
          backgroundColor: '#e0e7ff',
          color: '#4f46e5',
          borderRadius: '4px',
          marginRight: '0.5rem'
        }}
      >
        {signal.replace(/_/g, ' ')}
      </span>
    ));
  };

  const getTotalCovered = () => {
    return Object.values(signalCoverage).filter(s => s.covered).length;
  };

  const getTotalSignals = () => {
    return Object.keys(signalCoverage).length;
  };

  if (loading) {
    return (
      <div className="container">
        <p style={{ textAlign: 'center', color: '#757575' }}>Loading story slots...</p>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <BookOpen size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
          <h3>Journey not found</h3>
          <p style={{ color: '#757575' }}>The journey you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>{journey.title}</h1>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>{journey.description}</p>
      </div>

      {/* Signal Coverage Summary */}
      <div className="card" style={{ marginBottom: '2rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase' }}>
              Signal Coverage
            </h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5' }}>
              {getTotalCovered()} of {getTotalSignals()} signals covered
            </p>
          </div>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#e0e7ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={40} color="#4f46e5" />
          </div>
        </div>
      </div>

      {/* Story Slots */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Your Story Slots</h2>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {slotProgress.map((slot, index) => (
            <div
              key={slot.id}
              className="card"
              style={{
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onClick={() => navigate(`/journey/${journeyId}/story/${slot.slot_key}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'start' }}>
                {/* Slot Icon */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: slot.isComplete
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {slot.isComplete ? (
                    <CheckCircle2 size={28} color="white" />
                  ) : (
                    <BookOpen size={28} color="white" />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                      {index + 1}. {slot.title}
                    </h3>
                    {slot.isComplete && (
                      <span style={{
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        Completed
                      </span>
                    )}
                  </div>

                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 0.75rem 0', lineHeight: '1.5' }}>
                    {slot.description}
                  </p>

                  {/* Signals */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                      Signals: {slot.signals.join(', ')}
                    </p>
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {slot.estimated_minutes} minutes
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4f46e5', fontWeight: '500' }}>
                      {slot.userStory ? 'Continue' : 'Start'} <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {getTotalCovered() < getTotalSignals() && (
        <div className="card" style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#b45309' }}>
            Next Steps
          </h4>
          <p style={{ margin: 0, color: '#92400e', fontSize: '0.9rem' }}>
            You've covered {getTotalCovered()} of {getTotalSignals()} signals. Complete more story slots to cover all competencies.
          </p>
        </div>
      )}
    </div>
  );
}

export default StorySlotDashboard;
