import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import {
  getJourneyStorySlots,
  getSparcPrompts,
  createStory,
  updateStorySection,
  tagStorySignals,
  completeStory
} from '../../api';

function StoryBuilder() {
  const { journeyId, slotId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [storyId, setStoryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [slot, setSlot] = useState(null);

  // Step 1: Story Seed
  const [title, setTitle] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [stakeholders, setStakeholders] = useState('');
  const [stakes, setStakes] = useState('');

  // Step 2: Framework Selection
  const [framework, setFramework] = useState('SPARC');

  // Steps 3-7: SPARC Sections
  const [sparc, setSparc] = useState({
    situation: '',
    problem: '',
    actions: '',
    results: '',
    coda: ''
  });

  // Step 8: Signal Tagging
  const [signals, setSignals] = useState([]);
  const [availableSignals, setAvailableSignals] = useState([]);
  const [microPrompts, setMicroPrompts] = useState({});

  // Load slot details and available signals
  useEffect(() => {
    loadSlotAndSignals();
  }, [slotId]);

  const loadSlotAndSignals = async () => {
    try {
      // Get story slot details
      const slotRes = await getJourneyStorySlots(journeyId);
      const slotData = slotRes.data.find(s => s.slot_key === slotId);
      setSlot(slotData);

      // Get available signals from slot
      if (slotData && slotData.signals) {
        setAvailableSignals(slotData.signals);
        // Initialize with all signals unchecked
        setSignals(slotData.signals.map(s => ({ name: s, strength: 0 })));
      }

      // Load micro-prompts for each SPARC section
      const prompts = {};
      for (const section of ['situation', 'problem', 'actions', 'results', 'coda']) {
        const promptRes = await getSparcPrompts(section);
        prompts[section] = promptRes.data;
      }
      setMicroPrompts(prompts);
    } catch (err) {
      console.error('Error loading slot:', err);
      setError('Failed to load story slot details');
    }
  };

  const handleCreateStory = async () => {
    if (!title.trim() || !stakeholders.trim() || !stakes.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const res = await createStory({
        journeyId,
        slotId: parseInt(slot.id),
        storyTitle: title,
        year: parseInt(year),
        stakeholders,
        stakes
      });

      setStoryId(res.data.id);
      setCurrentStep(2);
      setError(null);
    } catch (err) {
      console.error('Error creating story:', err);
      setError(err.response?.data?.error || 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSparcSection = async (section) => {
    if (!sparc[section].trim()) {
      setError(`Please fill in the ${section} section`);
      return;
    }

    try {
      setLoading(true);
      await updateStorySection(storyId, section, sparc[section]);

      setError(null);

      // Auto-advance to next step
      if (section === 'situation' && currentStep === 3) setCurrentStep(4);
      else if (section === 'problem' && currentStep === 4) setCurrentStep(5);
      else if (section === 'actions' && currentStep === 5) setCurrentStep(6);
      else if (section === 'results' && currentStep === 6) setCurrentStep(7);
      else if (section === 'coda' && currentStep === 7) setCurrentStep(8);
    } catch (err) {
      console.error('Error saving SPARC section:', err);
      setError(err.response?.data?.error || `Failed to save ${section} section`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSignals = async () => {
    const selectedSignals = signals
      .filter(s => s.strength > 0)
      .map(s => ({ signalName: s.name, strength: s.strength }));

    if (selectedSignals.length === 0) {
      setError('Please select at least one signal');
      return;
    }

    try {
      setLoading(true);
      await tagStorySignals(storyId, selectedSignals);

      // Mark story as complete
      await completeStory(storyId);

      setError(null);
      // Navigate back to slot dashboard
      navigate(`/journey/${journeyId}/story-slots`);
    } catch (err) {
      console.error('Error saving signals:', err);
      setError(err.response?.data?.error || 'Failed to save signals');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = [
    'Story Seed',
    'Framework',
    'Situation',
    'Problem',
    'Actions',
    'Results',
    'Coda',
    'Signals'
  ];

  const totalSteps = 8;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0 }}>Build Your Story</h1>
          <button
            onClick={() => navigate(`/journey/${journeyId}/story-slots`)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            ✕
          </button>
        </div>
        {slot && (
          <p style={{ color: '#64748b', margin: 0 }}>
            Slot: <strong>{slot.title}</strong>
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          {stepLabels.map((label, i) => (
            <span
              key={i}
              style={{
                fontSize: '0.75rem',
                color: currentStep === i + 1 ? '#4f46e5' : i + 1 < currentStep ? '#10b981' : '#cbd5e1',
                fontWeight: currentStep === i + 1 ? 'bold' : 'normal'
              }}
            >
              {label}
            </span>
          ))}
        </div>
        <div style={{
          height: '8px',
          backgroundColor: '#e2e8f0',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            backgroundColor: '#4f46e5',
            width: `${progress}%`,
            transition: 'width 0.3s'
          }} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        {/* Step 1: Story Seed */}
        {currentStep === 1 && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem 0' }}>Story Seed</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Start by capturing the basic context of your story. These details help frame the situation.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Story Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 'Reducing deployment time by 80%'"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min="2000"
                  max={new Date().getFullYear()}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Key Stakeholders
              </label>
              <input
                type="text"
                value={stakeholders}
                onChange={(e) => setStakeholders(e.target.value)}
                placeholder="e.g., 'Product, Design, Infra team, CEO'"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Stakes
              </label>
              <textarea
                value={stakes}
                onChange={(e) => setStakes(e.target.value)}
                placeholder="What was at risk? Why did this matter?"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  minHeight: '100px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        )}

        {/* Step 2: Framework Selection */}
        {currentStep === 2 && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem 0' }}>Choose Framework</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              How would you like to structure your story?
            </p>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <label style={{
                padding: '1rem',
                border: framework === 'SPARC' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: framework === 'SPARC' ? '#eef2ff' : '#fff'
              }}>
                <input
                  type="radio"
                  name="framework"
                  value="SPARC"
                  checked={framework === 'SPARC'}
                  onChange={(e) => setFramework(e.target.value)}
                  style={{ marginRight: '0.5rem' }}
                />
                <strong>SPARC Framework</strong>
                <p style={{ margin: '0.5rem 0 0 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                  Situation → Problem → Actions → Results → Coda (Recommended)
                </p>
              </label>

              <label style={{
                padding: '1rem',
                border: framework === 'STAR' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: framework === 'STAR' ? '#eef2ff' : '#fff'
              }}>
                <input
                  type="radio"
                  name="framework"
                  value="STAR"
                  checked={framework === 'STAR'}
                  onChange={(e) => setFramework(e.target.value)}
                  style={{ marginRight: '0.5rem' }}
                />
                <strong>STAR Framework</strong>
                <p style={{ margin: '0.5rem 0 0 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                  Situation → Task → Action → Result (Classic format)
                </p>
              </label>
            </div>
          </div>
        )}

        {/* Steps 3-7: SPARC Sections */}
        {[3, 4, 5, 6, 7].includes(currentStep) && (
          <div>
            {(() => {
              const sectionIndex = currentStep - 3;
              const sections = ['situation', 'problem', 'actions', 'results', 'coda'];
              const section = sections[sectionIndex];
              const sectionTitles = {
                situation: 'Situation',
                problem: 'Problem',
                actions: 'Actions',
                results: 'Results',
                coda: 'Coda'
              };

              const prompts = microPrompts[section] || [];

              return (
                <>
                  <h2 style={{ margin: '0 0 0.5rem 0' }}>{sectionTitles[section]}</h2>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 1.5rem 0' }}>
                    Step {currentStep} of {totalSteps}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', marginBottom: '1.5rem' }}>
                    {/* Main textarea */}
                    <div>
                      <textarea
                        value={sparc[section]}
                        onChange={(e) => setSparc({ ...sparc, [section]: e.target.value })}
                        placeholder={`Write about the ${section} of your story...`}
                        style={{
                          width: '100%',
                          padding: '1rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '1rem',
                          minHeight: '300px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        {sparc[section].length} characters
                      </p>
                    </div>

                    {/* Micro-prompts sidebar */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      padding: '1rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
                        💡 Tips for {sectionTitles[section]}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {prompts.map((prompt, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: '0.85rem',
                              color: '#475569',
                              padding: '0.5rem',
                              backgroundColor: '#fff',
                              borderRadius: '4px',
                              borderLeft: '3px solid #4f46e5'
                            }}
                          >
                            {prompt.prompt_text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Step 8: Signal Tagging */}
        {currentStep === 8 && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem 0' }}>Tag Competencies</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Which signals does this story demonstrate? Rate your strength: 1 (weak), 2 (moderate), 3 (strong)
            </p>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {signals.map((signal) => (
                <div
                  key={signal.name}
                  style={{
                    padding: '1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <label style={{ flex: 1, fontSize: '0.95rem' }}>
                    <input
                      type="checkbox"
                      checked={signal.strength > 0}
                      onChange={(e) => {
                        const newSignals = signals.map(s =>
                          s.name === signal.name
                            ? { ...s, strength: e.target.checked ? 2 : 0 }
                            : s
                        );
                        setSignals(newSignals);
                      }}
                      style={{ marginRight: '0.5rem' }}
                    />
                    {signal.name.replace(/_/g, ' ')}
                  </label>

                  {signal.strength > 0 && (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {[1, 2, 3].map((level) => (
                        <button
                          key={level}
                          onClick={() => {
                            const newSignals = signals.map(s =>
                              s.name === signal.name
                                ? { ...s, strength: level }
                                : s
                            );
                            setSignals(newSignals);
                          }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: signal.strength >= level ? '#4f46e5' : '#e2e8f0',
                            color: signal.strength >= level ? '#fff' : '#64748b',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1 || loading}
          style={{
            padding: '0.75rem 1.5rem',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            backgroundColor: '#fff',
            color: '#64748b',
            cursor: currentStep === 1 || loading ? 'not-allowed' : 'pointer',
            opacity: currentStep === 1 || loading ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ChevronLeft size={18} /> Back
        </button>

        <button
          onClick={() => {
            if (currentStep === 1) handleCreateStory();
            else if (currentStep === 2) setCurrentStep(3);
            else if ([3, 4, 5, 6, 7].includes(currentStep)) {
              const sections = ['situation', 'problem', 'actions', 'results', 'coda'];
              handleSaveSparcSection(sections[currentStep - 3]);
            } else if (currentStep === 8) handleSaveSignals();
          }}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: '600'
          }}
        >
          {loading && 'Saving...'}
          {!loading && currentStep === totalSteps && (
            <>
              <Check size={18} /> Complete
            </>
          )}
          {!loading && currentStep < totalSteps && (
            <>
              Next <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default StoryBuilder;
