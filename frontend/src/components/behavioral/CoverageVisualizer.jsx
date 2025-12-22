import { useEffect, useState } from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { getJourneySignalCoverage, getJourneyStories } from '../../api';

/**
 * Coverage Visualizer Component
 *
 * Shows signal coverage across all user stories in a journey using:
 * - Bar chart showing count per signal
 * - Visual strength indicator
 * - Gap highlighting (uncovered signals)
 * - Story breakdown for each signal
 *
 * Props:
 * - journeyId: ID of the journey
 * - allSignals: Array of all possible signals for this journey
 * - onSignalClick: Callback when user clicks a signal (optional)
 */
function CoverageVisualizer({
  journeyId,
  allSignals = [],
  onSignalClick = null
}) {
  const [coverage, setCoverage] = useState({});
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSignal, setExpandedSignal] = useState(null);

  const signalDescriptions = {
    ownership: 'Ownership, impact & execution',
    ambiguity: 'Ambiguity & problem solving',
    collaboration: 'Collaboration & communication',
    conflict: 'Conflict, pushback & influence',
    leadership: 'Leadership & strategic thinking',
    craft: 'Quality, craft & reliability',
    product_sense: 'Product sense & customer focus',
    people_management: 'People management',
    execution: 'Execution & delivery',
    learning: 'Learning, feedback & growth'
  };

  useEffect(() => {
    loadCoverageData();
  }, [journeyId]);

  const loadCoverageData = async () => {
    try {
      setLoading(true);

      // Load signal coverage
      const coverageRes = await getJourneySignalCoverage(journeyId);
      setCoverage(coverageRes.data || {});

      // Load all stories to show breakdown
      const storiesRes = await getJourneyStories(journeyId);
      setStories(storiesRes.data || []);

      setError(null);
    } catch (err) {
      console.error('Error loading coverage:', err);
      setError('Failed to load coverage data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
        Loading coverage data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        padding: '1rem',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <AlertCircle size={20} />
        {error}
      </div>
    );
  }

  // Calculate totals
  const totalSignalsCovered = Object.values(coverage).filter(s => s.covered).length;
  const totalSignals = allSignals.length > 0 ? allSignals.length : Object.keys(coverage).length;
  const maxCount = Math.max(...Object.values(coverage).map(s => s.count || 0), 1);

  // Get covered signals
  const coveredSignals = Object.entries(coverage)
    .filter(([_, data]) => data.covered)
    .sort((a, b) => (b[1].count || 0) - (a[1].count || 0));

  // Get uncovered signals
  const uncoveredSignals = allSignals.filter(
    signal => !coverage[signal] || !coverage[signal].covered
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <TrendingUp size={32} color="#4f46e5" />
          <div>
            <h2 style={{ margin: '0 0 0.25rem 0' }}>Signal Coverage</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              {totalSignalsCovered} of {totalSignals} competencies demonstrated
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{
            height: '8px',
            backgroundColor: '#e2e8f0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              backgroundColor: '#4f46e5',
              width: `${(totalSignalsCovered / totalSignals) * 100}%`,
              transition: 'width 0.3s'
            }} />
          </div>
        </div>
      </div>

      {/* Covered Signals */}
      {coveredSignals.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>
            ✓ Covered ({coveredSignals.length})
          </h3>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {coveredSignals.map(([signal, data]) => (
              <div
                key={signal}
                onClick={() => {
                  setExpandedSignal(expandedSignal === signal ? null : signal);
                  if (onSignalClick) onSignalClick(signal);
                }}
                style={{
                  padding: '1rem',
                  border: expandedSignal === signal ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: expandedSignal === signal ? '#eef2ff' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {/* Signal Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>
                      {signal.replace(/_/g, ' ')}
                    </h4>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
                      {signalDescriptions[signal]}
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: '#10b981',
                    color: '#fff',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontWeight: '600',
                    minWidth: '80px',
                    textAlign: 'center'
                  }}>
                    {data.count || 0} stories
                  </div>
                </div>

                {/* Bar Chart */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    flex: 1,
                    height: '12px',
                    backgroundColor: '#e0e7ff',
                    borderRadius: '6px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      backgroundColor: '#4f46e5',
                      width: `${((data.count || 0) / maxCount) * 100}%`,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', minWidth: '40px', textAlign: 'right' }}>
                    {data.count || 0}/{maxCount}
                  </span>
                </div>

                {/* Strength Indicator */}
                {data.avg_strength && (
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    Avg Strength: {data.avg_strength.toFixed(1)}/3
                    <div style={{ fontSize: '0.75rem', color: '#4f46e5' }}>
                      {'★'.repeat(Math.round(data.avg_strength))}{'☆'.repeat(3 - Math.round(data.avg_strength))}
                    </div>
                  </div>
                )}

                {/* Expanded Story Breakdown */}
                {expandedSignal === signal && stories.length > 0 && (
                  <div style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e2e8f0'
                  }}>
                    <p style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#64748b',
                      marginBottom: '0.75rem',
                      textTransform: 'uppercase'
                    }}>
                      Stories Demonstrating This
                    </p>
                    <ul style={{
                      margin: 0,
                      paddingLeft: '1.25rem',
                      fontSize: '0.9rem',
                      color: '#475569'
                    }}>
                      {stories
                        .filter(s => {
                          // In a real app, you'd filter based on story signals
                          // For now, just show a few example stories
                          return true;
                        })
                        .slice(0, 3)
                        .map((story, i) => (
                          <li key={i} style={{ marginBottom: '0.5rem' }}>
                            {story.story_title || 'Untitled Story'}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uncovered Signals */}
      {uncoveredSignals.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚠️ Gaps ({uncoveredSignals.length})
          </h3>

          <div style={{
            padding: '1.5rem',
            backgroundColor: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '8px'
          }}>
            <p style={{ margin: '0 0 1rem 0', color: '#92400e', fontWeight: '600' }}>
              These signals haven't been demonstrated yet. Consider writing stories that showcase these competencies:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {uncoveredSignals.map(signal => (
                <div
                  key={signal}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    color: '#b45309'
                  }}
                >
                  <div style={{ fontWeight: '600' }}>
                    {signal.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {signalDescriptions[signal]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoverageVisualizer;
