import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Target, TrendingUp, ArrowRight, Clock, CheckCircle2, Library, Calendar, Zap } from 'lucide-react';
import { getMyJourneys } from '../api';

function Dashboard({ user }) {
  const [activeJourneys, setActiveJourneys] = useState([]);
  const [journeyStats, setJourneyStats] = useState({
    totalJourneys: 0,
    completedTasks: 0,
    totalTasks: 0
  });
  const [recentAnswers, setRecentAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get user's active journeys
      const journeysResponse = await getMyJourneys();

      const journeys = journeysResponse.data;
      setActiveJourneys(journeys);

      // Calculate stats
      const totalTasks = journeys.reduce((sum, j) => sum + (j.total_tasks || 0), 0);
      const completedTasks = journeys.reduce((sum, j) => sum + (j.completed_tasks || 0), 0);

      setJourneyStats({
        totalJourneys: journeys.length,
        completedTasks,
        totalTasks
      });

      // Get recent answers across all journeys (we'll implement this API later)
      // For now, just use empty array
      setRecentAnswers([]);

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return '#10b981';
    if (percentage >= 50) return '#f59e0b';
    if (percentage >= 25) return '#6366f1';
    return '#94a3b8';
  };

  const isBehavioralJourney = (journey) => {
    // Behavioral journeys have a journey_type or contain 'interview' or 'behavioral' in title/description
    return journey.journey_type === 'behavioral' ||
           journey.title.toLowerCase().includes('interview') ||
           journey.description?.toLowerCase().includes('interview');
  };

  const getJourneyRoute = (journey) => {
    return isBehavioralJourney(journey)
      ? `/journey/${journey.journey_id}/story-slots`
      : `/journey/${journey.journey_id}`;
  };

  const getJourneyIcon = (journey) => {
    if (isBehavioralJourney(journey)) {
      return (
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Zap size={32} color="white" />
        </div>
      );
    }
    return (
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <BookOpen size={32} color="white" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container">
        <p style={{ textAlign: 'center', color: '#757575' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>
          Welcome back, {user.displayName}!
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
          Continue your learning journey
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <Library size={32} style={{ color: '#6366f1', margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1' }}>
            {journeyStats.totalJourneys}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Active Journeys
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <CheckCircle2 size={32} style={{ color: '#10b981', margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            {journeyStats.completedTasks}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Tasks Completed
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <Target size={32} style={{ color: '#f59e0b', margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {journeyStats.totalTasks - journeyStats.completedTasks}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Tasks Remaining
          </div>
        </div>
      </div>

      {/* Active Journeys */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>My Active Journeys</h2>
          <Link
            to="/journeys"
            style={{
              color: '#6366f1',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            Browse more
            <ArrowRight size={14} />
          </Link>
        </div>

        {activeJourneys.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <BookOpen size={48} style={{ color: '#cbd5e1', margin: '0 auto 1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', color: '#64748b' }}>No active journeys yet</h3>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
              Start your learning journey by enrolling in a course
            </p>
            <Link to="/journeys" style={{ textDecoration: 'none' }}>
              <button className="btn-primary">
                Explore Journey Library
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {activeJourneys.map((journey) => (
              <Link
                key={journey.journey_id}
                to={getJourneyRoute(journey)}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="card"
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: isBehavioralJourney(journey) ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                    backgroundColor: isBehavioralJourney(journey) ? '#fffbeb' : 'transparent'
                  }}
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
                    {getJourneyIcon(journey)}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '1rem' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{journey.title}</h3>
                            {isBehavioralJourney(journey) && (
                              <span style={{
                                backgroundColor: '#fef3c7',
                                color: '#b45309',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap'
                              }}>
                                Interview Prep
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{
                          backgroundColor: getProgressColor(journey.completion_percentage) + '20',
                          color: getProgressColor(journey.completion_percentage),
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}>
                          {Math.round(journey.completion_percentage || 0)}%
                        </div>
                      </div>

                      <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
                        {journey.description}
                      </p>

                      {/* Progress Bar */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: '#e2e8f0',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${journey.completion_percentage || 0}%`,
                            height: '100%',
                            backgroundColor: getProgressColor(journey.completion_percentage),
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>

                      {/* Journey Meta */}
                      <div style={{
                        display: 'flex',
                        gap: '1.5rem',
                        fontSize: '0.85rem',
                        color: '#64748b'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <BookOpen size={14} />
                          <span>{journey.completed_tasks || 0} / {journey.total_tasks || 0} tasks</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={14} />
                          <span>{journey.duration_weeks} weeks</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={14} />
                          <span style={{ textTransform: 'capitalize' }}>{journey.cadence}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: '600' }}>
          Quick Actions
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          <Link to="/journaling" style={{ textDecoration: 'none' }}>
            <div className="card" style={{
              cursor: 'pointer',
              textAlign: 'center',
              padding: '2rem',
              transition: 'transform 0.2s'
            }}>
              <BookOpen size={32} style={{ color: '#6366f1', margin: '0 auto 0.75rem' }} />
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Journaling</h4>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                Write, reflect, and track your thoughts
              </p>
            </div>
          </Link>

          <Link to="/journeys" style={{ textDecoration: 'none' }}>
            <div className="card" style={{
              cursor: 'pointer',
              textAlign: 'center',
              padding: '2rem',
              transition: 'transform 0.2s'
            }}>
              <Library size={32} style={{ color: '#10b981', margin: '0 auto 0.75rem' }} />
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Browse Journeys</h4>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                Discover new learning paths
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
