import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { getSparcPrompts, updateStorySection } from '../../api';

/**
 * Reusable SPARC Section Component
 *
 * Can be used for:
 * - Creating new stories (within StoryBuilder wizard)
 * - Editing existing stories
 * - Reviewing completed stories
 *
 * Props:
 * - storyId: ID of the story (required for editing)
 * - section: 'situation', 'problem', 'actions', 'results', or 'coda'
 * - initialContent: Pre-filled content for editing
 * - showPrompts: Whether to show micro-prompts sidebar (default: true)
 * - readOnly: Whether section is read-only (default: false)
 * - onSave: Callback when section is saved
 * - maxWords: Maximum word count (optional)
 */
function SPARCSection({
  storyId,
  section,
  initialContent = '',
  showPrompts = true,
  readOnly = false,
  onSave = null,
  maxWords = null
}) {
  const [content, setContent] = useState(initialContent);
  const [microPrompts, setMicroPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const sectionTitles = {
    situation: 'Situation',
    problem: 'Problem',
    actions: 'Actions',
    results: 'Results',
    coda: 'Coda'
  };

  const sectionDescriptions = {
    situation: 'Set the context. What was the situation? What was the goal?',
    problem: 'What was hard or complex about this? Why wasn\'t it straightforward?',
    actions: 'What did you do? Call out 3-5 key decisions or actions you took.',
    results: 'What was the outcome? What changed as a result of your actions?',
    coda: 'Reflection. What would you do differently? What did you learn?'
  };

  useEffect(() => {
    if (showPrompts) {
      loadMicroPrompts();
    }
  }, [section, showPrompts]);

  const loadMicroPrompts = async () => {
    try {
      setLoading(true);
      const res = await getSparcPrompts(section);
      setMicroPrompts(res.data);
      setError(null);
    } catch (err) {
      console.error('Error loading prompts:', err);
      setError('Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Please fill in this section');
      return;
    }

    if (maxWords) {
      const wordCount = content.trim().split(/\s+/).length;
      if (wordCount > maxWords) {
        setError(`Please reduce to ${maxWords} words or fewer (currently ${wordCount})`);
        return;
      }
    }

    try {
      setSaving(true);
      await updateStorySection(storyId, section, content);

      setError(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);

      if (onSave) {
        onSave({ section, content });
      }
    } catch (err) {
      console.error('Error saving section:', err);
      setError(err.response?.data?.error || 'Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
  const characterCount = content.length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showPrompts ? '1fr 300px' : '1fr', gap: '2rem' }}>
      {/* Main Editor */}
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
            {sectionTitles[section]}
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            {sectionDescriptions[section]}
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
            fontSize: '0.9rem'
          }}>
            ✓ Saved successfully
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={readOnly || saving}
          placeholder={`Write about the ${section} of your story...`}
          style={{
            width: '100%',
            padding: '1rem',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '1rem',
            minHeight: '400px',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            opacity: saving ? 0.7 : 1,
            cursor: readOnly ? 'not-allowed' : 'text'
          }}
        />

        {/* Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f8fafc',
          borderRadius: '6px',
          fontSize: '0.85rem',
          color: '#64748b'
        }}>
          <div>
            {wordCount} words • {characterCount} characters
            {maxWords && ` / ${maxWords} words max`}
          </div>

          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={saving || loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: success ? '#10b981' : '#4f46e5',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {/* Micro-Prompts Sidebar */}
      {showPrompts && (
        <div>
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            height: 'fit-content',
            position: 'sticky',
            top: '1rem'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: '600' }}>
              💡 Tips & Prompts
            </h4>

            {loading ? (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading prompts...</p>
            ) : microPrompts.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No prompts available</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {microPrompts.map((prompt, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: '0.85rem',
                      color: '#475569',
                      padding: '0.75rem',
                      backgroundColor: '#fff',
                      borderRadius: '4px',
                      borderLeft: '3px solid #4f46e5',
                      lineHeight: '1.4'
                    }}
                  >
                    {prompt.prompt_text}
                  </div>
                ))}
              </div>
            )}

            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #e2e8f0'
            }}>
              <p style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: '#64748b',
                textTransform: 'uppercase'
              }}>
                ✨ Pro Tips
              </p>
              <ul style={{
                margin: 0,
                paddingLeft: '1rem',
                fontSize: '0.8rem',
                color: '#64748b',
                lineHeight: '1.6'
              }}>
                <li>Be specific with examples</li>
                <li>Quantify impact when possible</li>
                <li>Show your thinking process</li>
                <li>Keep it conversational</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SPARCSection;
