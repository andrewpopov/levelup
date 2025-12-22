import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { tagStorySignals } from '../../api';

/**
 * Signal Tagging Component
 *
 * Allows users to tag their stories with competency signals and rate strength.
 *
 * Props:
 * - storyId: ID of the story being tagged
 * - availableSignals: Array of signal names available for this story slot
 * - slotTitle: Title of the story slot (for context)
 * - onSave: Callback when signals are saved
 * - onSkip: Callback if user skips tagging
 * - readOnly: If true, just displays signals (default: false)
 * - existingSignals: Pre-filled signals for editing
 */
function SignalTagger({
  storyId,
  availableSignals = [],
  slotTitle = '',
  onSave = null,
  onSkip = null,
  readOnly = false,
  existingSignals = []
}) {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Signal descriptions for this journey
  const signalDescriptions = {
    ownership: 'Demonstrated ownership, proactivity, and accountability',
    ambiguity: 'Handled ambiguity and unclear requirements effectively',
    collaboration: 'Worked effectively with others, communicated well',
    conflict: 'Navigated conflict, addressed pushback, influenced others',
    leadership: 'Showed leadership qualities and strategic thinking',
    craft: 'High quality work, attention to detail, reliability',
    product_sense: 'Strong product instincts and customer focus',
    people_management: 'Ability to develop and manage people',
    execution: 'Ability to plan and execute on complex projects',
    learning: 'Learning from feedback, growth mindset'
  };

  useEffect(() => {
    // Initialize signals from available signals or existing selections
    const initialSignals = availableSignals.map(signal => {
      const existing = existingSignals.find(s => s.name === signal);
      return {
        name: signal,
        strength: existing ? existing.strength : 0
      };
    });
    setSignals(initialSignals);
  }, [availableSignals, existingSignals]);

  const toggleSignal = (signalName) => {
    setSignals(signals.map(s =>
      s.name === signalName
        ? { ...s, strength: s.strength > 0 ? 0 : 2 } // Toggle between 0 and 2
        : s
    ));
    setError(null);
  };

  const setStrength = (signalName, strength) => {
    setSignals(signals.map(s =>
      s.name === signalName
        ? { ...s, strength }
        : s
    ));
  };

  const handleSave = async () => {
    const selectedSignals = signals.filter(s => s.strength > 0);

    if (selectedSignals.length === 0) {
      setError('Please select at least one signal that this story demonstrates');
      return;
    }

    try {
      setSaving(true);
      await tagStorySignals(storyId, selectedSignals.map(s => ({ signalName: s.name, strength: s.strength })));

      setError(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);

      if (onSave) {
        onSave(selectedSignals);
      }
    } catch (err) {
      console.error('Error saving signals:', err);
      setError(err.response?.data?.error || 'Failed to save signals');
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = signals.filter(s => s.strength > 0).length;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
          Tag Competencies
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
          Which signals does this story demonstrate? Rate your strength: 1 (weak), 2 (moderate), 3 (strong)
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '0.75rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: '#dcfce7',
          color: '#166534',
          padding: '0.75rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Check size={18} /> Signals saved successfully
        </div>
      )}

      {/* Signals Grid */}
      <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
        {signals.map((signal) => (
          <div
            key={signal.name}
            style={{
              padding: '1rem',
              border: signal.strength > 0 ? '2px solid #4f46e5' : '1px solid #e2e8f0',
              borderRadius: '8px',
              backgroundColor: signal.strength > 0 ? '#eef2ff' : '#fff',
              transition: 'all 0.2s'
            }}
          >
            {/* Signal Header */}
            <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '0.75rem' }}>
              <label style={{ flex: 1, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={signal.strength > 0}
                  onChange={() => toggleSignal(signal.name)}
                  disabled={readOnly}
                  style={{
                    marginRight: '0.75rem',
                    cursor: readOnly ? 'not-allowed' : 'pointer',
                    width: '18px',
                    height: '18px'
                  }}
                />
                <strong style={{ fontSize: '1rem' }}>
                  {signal.name.replace(/_/g, ' ')}
                </strong>
              </label>

              {/* Strength Stars */}
              {signal.strength > 0 && !readOnly && (
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {[1, 2, 3].map((level) => (
                    <button
                      key={level}
                      onClick={() => setStrength(signal.name, level)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: signal.strength >= level ? '#4f46e5' : '#e2e8f0',
                        color: signal.strength >= level ? '#fff' : '#64748b',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              )}

              {signal.strength > 0 && readOnly && (
                <div style={{ fontSize: '0.85rem', color: '#4f46e5', fontWeight: '600' }}>
                  {'★'.repeat(signal.strength)}
                </div>
              )}
            </div>

            {/* Signal Description */}
            <p style={{
              color: '#64748b',
              fontSize: '0.9rem',
              margin: 0,
              paddingLeft: '1.75rem'
            }}>
              {signalDescriptions[signal.name] || 'Description not available'}
            </p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{
        padding: '1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '6px',
        border: '1px solid #e2e8f0',
        marginBottom: '1.5rem',
        fontSize: '0.9rem',
        color: '#64748b'
      }}>
        <strong>{selectedCount}</strong> signal{selectedCount !== 1 ? 's' : ''} selected
        {selectedCount > 0 && (
          <span style={{ marginLeft: '1rem' }}>
            {signals.filter(s => s.strength > 0).map(s => s.name.replace(/_/g, ' ')).join(', ')}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={handleSave}
          disabled={saving || readOnly}
          style={{
            flex: 1,
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: saving || readOnly ? 'not-allowed' : 'pointer',
            opacity: saving || readOnly ? 0.7 : 1,
            fontWeight: '600',
            fontSize: '1rem'
          }}
        >
          {saving ? 'Saving...' : 'Save Signals'}
        </button>

        {onSkip && !readOnly && (
          <button
            onClick={onSkip}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem'
            }}
          >
            Skip for Now
          </button>
        )}
      </div>
    </div>
  );
}

export default SignalTagger;
