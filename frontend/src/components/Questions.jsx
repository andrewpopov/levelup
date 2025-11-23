import { useState, useEffect } from 'react';
import {
  getQuestions,
  getQuestionCategories,
  getQuestion,
  saveQuestionResponse,
  deleteQuestionResponse
} from '../api';

export default function Questions() {
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, questionsRes] = await Promise.all([
        getQuestionCategories(),
        getQuestions()
      ]);
      setCategories(categoriesRes.data);
      setQuestions(questionsRes.data);
    } catch (err) {
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionDetail = async (questionId) => {
    try {
      const res = await getQuestion(questionId);
      setSelectedQuestion(res.data);

      // Set current user's response if exists
      const userResponse = res.data.responses?.find(
        r => r.user_id === currentUser.id
      );
      setResponseText(userResponse?.response_text || '');
      setError('');
      setSuccess('');
    } catch (err) {
      setError('Failed to load question details');
    }
  };

  const handleSaveResponse = async () => {
    if (!responseText.trim()) {
      setError('Please enter a response');
      return;
    }

    try {
      setSaving(true);
      await saveQuestionResponse(selectedQuestion.id, responseText);
      setSuccess('Response saved successfully!');
      // Reload question to get updated responses
      await loadQuestionDetail(selectedQuestion.id);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save response');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResponse = async () => {
    if (!window.confirm('Are you sure you want to delete your response?')) {
      return;
    }

    try {
      await deleteQuestionResponse(selectedQuestion.id);
      setResponseText('');
      setSuccess('Response deleted');
      await loadQuestionDetail(selectedQuestion.id);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete response');
    }
  };

  const filteredQuestions = selectedCategory === 'all'
    ? questions
    : questions.filter(q => q.category_id === parseInt(selectedCategory));

  const groupedQuestions = categories.map(category => ({
    ...category,
    questions: questions.filter(q => q.category_id === category.id)
  }));

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Guided Couples Questions
        </h1>
        <p className="text-gray-600">
          52 weeks of conversations for a strong, connected relationship
        </p>
      </div>

      {selectedQuestion ? (
        // Question Detail View
        <div>
          <button
            onClick={() => setSelectedQuestion(null)}
            className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to all questions
          </button>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="mb-4">
              <span className="text-sm text-gray-500">Week {selectedQuestion.week_number}</span>
              <span className="mx-2">•</span>
              <span className="text-sm text-blue-600">{selectedQuestion.category_name}</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {selectedQuestion.title}
            </h2>

            <p className="text-lg text-gray-700 mb-6 italic">
              {selectedQuestion.main_prompt}
            </p>

            {selectedQuestion.details && selectedQuestion.details.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Guiding Questions:
                </h3>
                <ul className="space-y-2">
                  {selectedQuestion.details.map((detail) => (
                    <li key={detail.id} className="text-gray-600 flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>{detail.detail_text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Your Response */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Your Response
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                {success}
              </div>
            )}

            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Write your response here..."
              className="w-full p-3 border rounded-lg mb-4 min-h-[200px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <div className="flex gap-3">
              <button
                onClick={handleSaveResponse}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save Response'}
              </button>

              {responseText && (
                <button
                  onClick={handleDeleteResponse}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Response
                </button>
              )}
            </div>
          </div>

          {/* Partner's Response */}
          {selectedQuestion.responses && selectedQuestion.responses.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Responses
              </h3>

              <div className="space-y-4">
                {selectedQuestion.responses.map((response) => (
                  <div
                    key={response.id}
                    className={`p-4 rounded-lg ${
                      response.user_id === currentUser.id
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'bg-gray-50 border-l-4 border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800">
                        {response.display_name}
                        {response.user_id === currentUser.id && (
                          <span className="ml-2 text-sm text-blue-600">(You)</span>
                        )}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {new Date(response.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {response.response_text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Questions List View
        <div>
          {/* Category Filter */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Questions
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id.toString())}
                className={`px-4 py-2 rounded-lg ${
                  selectedCategory === category.id.toString()
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Questions by Category */}
          {selectedCategory === 'all' ? (
            groupedQuestions.map((category) => (
              <div key={category.id} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {category.name}
                </h2>
                <p className="text-gray-600 mb-4">{category.description}</p>

                <div className="grid gap-4 md:grid-cols-2">
                  {category.questions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      onClick={() => loadQuestionDetail(question.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredQuestions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  onClick={() => loadQuestionDetail(question.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionCard({ question, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-5 text-left hover:shadow-lg transition-shadow"
    >
      <div className="mb-2">
        <span className="text-sm font-semibold text-blue-600">
          Week {question.week_number}
        </span>
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">
        {question.title}
      </h3>
      <p className="text-gray-600 text-sm line-clamp-2">
        {question.main_prompt}
      </p>
    </button>
  );
}
