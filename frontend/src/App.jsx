import { useEffect, useState } from 'react';
import { apiRequest } from './api.js';

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', role: '' });

  async function loadCandidates() {
    try {
      const data = await apiRequest('/api/candidates');
      setCandidates(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadCandidates();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await apiRequest('/api/candidates', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setForm({ name: '', email: '', role: '' });
      await loadCandidates();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 800, margin: '40px auto' }}>
      <h1>Candidate Feedback Board</h1>

      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          placeholder="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          required
        />
        <button type="submit">Add candidate</button>
      </form>

      <h2>Candidates</h2>
      <ul>
        {candidates.map((candidate) => (
          <li key={candidate.id}>
            <strong>{candidate.name}</strong> — {candidate.role} ({candidate.status})
            <br />
            Average rating: {candidate.average_rating} · Interviews: {candidate.interview_count}
          </li>
        ))}
      </ul>
    </main>
  );
}
