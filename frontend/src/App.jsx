import { useEffect, useState } from 'react';
import { apiRequest } from './api.js';

const inputStyle = {
  padding: '8px',
  border: '1px solid #ccc',
  borderRadius: 4
};

const buttonStyle = {
  padding: '8px 12px',
  border: 'none',
  borderRadius: 4,
  background: '#2563eb',
  color: 'white',
  cursor: 'pointer'
};

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    email: '',
    role: ''
  });
  const [interviewForm, setInterviewForm] = useState({
    interviewer: '',
    scheduledAt: ''
  });
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 3,
    strengths: '',
    concerns: '',
    recommendation: 'maybe'
  });

  async function loadCandidates() {
    try {
      const data = await apiRequest('/api/candidates');
      setCandidates(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadCandidate(id) {
    setLoading(true);
    try {
      const data = await apiRequest(`/api/candidates/${id}`);
      setSelectedCandidate(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCandidates();
  }, []);

  async function handleCandidateSubmit(event) {
    event.preventDefault();
    try {
      await apiRequest('/api/candidates', {
        method: 'POST',
        body: JSON.stringify(candidateForm)
      });
      setCandidateForm({ name: '', email: '', role: '' });
      await loadCandidates();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleInterviewSubmit(event) {
    event.preventDefault();
    try {
      await apiRequest(
        `/api/candidates/${selectedCandidate.id}/interviews`,
        {
          method: 'POST',
          body: JSON.stringify({
            interviewer: interviewForm.interviewer,
            scheduledAt: new Date(interviewForm.scheduledAt).toISOString()
          })
        }
      );
      setInterviewForm({ interviewer: '', scheduledAt: '' });
      await loadCandidate(selectedCandidate.id);
      await loadCandidates();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleFeedbackSubmit(event, interviewId) {
    event.preventDefault();
    try {
      await apiRequest(`/api/interviews/${interviewId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          rating: Number(feedbackForm.rating),
          strengths: feedbackForm.strengths || undefined,
          concerns: feedbackForm.concerns || undefined,
          recommendation: feedbackForm.recommendation
        })
      });
      setFeedbackForm({
        rating: 3,
        strengths: '',
        concerns: '',
        recommendation: 'maybe'
      });
      await loadCandidate(selectedCandidate.id);
      await loadCandidates();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 900, margin: '40px auto' }}>
      <h1>Candidate Feedback Board</h1>

      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}

      <section>
        <h2>Add candidate</h2>
        <form
          onSubmit={handleCandidateSubmit}
          style={{ display: 'grid', gap: 8, maxWidth: 400 }}
        >
          <input
            placeholder="Name"
            style={inputStyle}
            value={candidateForm.name}
            onChange={(e) =>
              setCandidateForm({ ...candidateForm, name: e.target.value })
            }
            required
          />
          <input
            type="email"
            placeholder="Email"
            style={inputStyle}
            value={candidateForm.email}
            onChange={(e) =>
              setCandidateForm({ ...candidateForm, email: e.target.value })
            }
            required
          />
          <input
            placeholder="Role"
            style={inputStyle}
            value={candidateForm.role}
            onChange={(e) =>
              setCandidateForm({ ...candidateForm, role: e.target.value })
            }
            required
          />
          <button type="submit" style={buttonStyle}>
            Add candidate
          </button>
        </form>
      </section>

      <section>
        <h2>Candidates</h2>
        <ul>
          {candidates.map((candidate) => (
            <li key={candidate.id} style={{ marginBottom: 8 }}>
              <button
                type="button"
                onClick={() => loadCandidate(candidate.id)}
                style={{
                  ...buttonStyle,
                  background: selectedCandidate?.id === candidate.id
                    ? '#1d4ed8'
                    : '#64748b'
                }}
              >
                {candidate.name}
              </button>{' '}
              {candidate.role} · {candidate.status} · Average rating:{' '}
              {candidate.average_rating} · Interviews:{' '}
              {candidate.interview_count}
            </li>
          ))}
        </ul>
      </section>

      {loading && <p>Loading candidate…</p>}

      {selectedCandidate && (
        <section>
          <h2>{selectedCandidate.name}</h2>
          <p>
            {selectedCandidate.role} · {selectedCandidate.email} ·{' '}
            {selectedCandidate.status}
          </p>

          <h3>Schedule interview</h3>
          <form
            onSubmit={handleInterviewSubmit}
            style={{ display: 'grid', gap: 8, maxWidth: 400 }}
          >
            <input
              placeholder="Interviewer"
              style={inputStyle}
              value={interviewForm.interviewer}
              onChange={(e) =>
                setInterviewForm({
                  ...interviewForm,
                  interviewer: e.target.value
                })
              }
              required
            />
            <input
              type="datetime-local"
              style={inputStyle}
              value={interviewForm.scheduledAt}
              onChange={(e) =>
                setInterviewForm({
                  ...interviewForm,
                  scheduledAt: e.target.value
                })
              }
              required
            />
            <button type="submit" style={buttonStyle}>
              Schedule interview
            </button>
          </form>

          <h3>Interviews</h3>
          {selectedCandidate.interviews.length === 0 && (
            <p>No interviews scheduled yet.</p>
          )}

          {selectedCandidate.interviews.map((interview) => (
            <div
              key={interview.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 6,
                padding: 12,
                marginBottom: 12
              }}
            >
              <strong>{interview.interviewer}</strong> ·{' '}
              {new Date(interview.scheduledAt).toLocaleString()} ·{' '}
              {interview.status}

              {interview.feedback ? (
                <div>
                  <p>
                    <strong>Feedback:</strong> {interview.feedback.rating}/5 ·{' '}
                    {interview.feedback.recommendation}
                  </p>
                  {interview.feedback.strengths && (
                    <p>Strengths: {interview.feedback.strengths}</p>
                  )}
                  {interview.feedback.concerns && (
                    <p>Concerns: {interview.feedback.concerns}</p>
                  )}
                </div>
              ) : (
                <form
                  onSubmit={(event) =>
                    handleFeedbackSubmit(event, interview.id)
                  }
                  style={{ display: 'grid', gap: 8, marginTop: 12 }}
                >
                  <label>
                    Rating
                    <select
                      style={inputStyle}
                      value={feedbackForm.rating}
                      onChange={(e) =>
                        setFeedbackForm({
                          ...feedbackForm,
                          rating: e.target.value
                        })
                      }
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Recommendation
                    <select
                      style={inputStyle}
                      value={feedbackForm.recommendation}
                      onChange={(e) =>
                        setFeedbackForm({
                          ...feedbackForm,
                          recommendation: e.target.value
                        })
                      }
                    >
                      <option value="hire">Hire</option>
                      <option value="maybe">Maybe</option>
                      <option value="no_hire">No hire</option>
                    </select>
                  </label>

                  <textarea
                    placeholder="Strengths"
                    style={inputStyle}
                    value={feedbackForm.strengths}
                    onChange={(e) =>
                      setFeedbackForm({
                        ...feedbackForm,
                        strengths: e.target.value
                      })
                    }
                  />
                  <textarea
                    placeholder="Concerns"
                    style={inputStyle}
                    value={feedbackForm.concerns}
                    onChange={(e) =>
                      setFeedbackForm({
                        ...feedbackForm,
                        concerns: e.target.value
                      })
                    }
                  />
                  <button type="submit" style={buttonStyle}>
                    Submit feedback
                  </button>
                </form>
              )}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
