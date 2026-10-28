import 'dotenv/config';
import express from 'express';
import { z } from 'zod';
import { pool } from './db.js';

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const candidateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1)
});

const interviewSchema = z.object({
  interviewer: z.string().min(1),
  scheduledAt: z.string().datetime()
});

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  strengths: z.string().optional(),
  concerns: z.string().optional(),
  recommendation: z.enum(['hire', 'no_hire', 'maybe'])
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('select 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'degraded' });
  }
});

app.get('/api/candidates', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      select
        c.id,
        c.name,
        c.email,
        c.role,
        c.status,
        coalesce(round(avg(f.rating)::numeric, 2), 0) as average_rating,
        count(distinct i.id) as interview_count
      from candidates c
      left join interviews i on i.candidate_id = c.id
      left join feedback f on f.interview_id = i.id
      group by c.id
      order by c.created_at desc
    `);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/candidates', async (req, res, next) => {
  try {
    const data = candidateSchema.parse(req.body);
    const { rows } = await pool.query(
      `insert into candidates (name, email, role)
       values ($1, $2, $3)
       returning *`,
      [data.name, data.email, data.role]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post('/api/candidates/:id/interviews', async (req, res, next) => {
  try {
    const data = interviewSchema.parse(req.body);
    const { rows } = await pool.query(
      `insert into interviews (candidate_id, interviewer, scheduled_at)
       values ($1, $2, $3)
       returning *`,
      [req.params.id, data.interviewer, data.scheduledAt]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post('/api/interviews/:id/feedback', async (req, res, next) => {
  try {
    const data = feedbackSchema.parse(req.body);
    const { rows } = await pool.query(
      `insert into feedback
        (interview_id, rating, strengths, concerns, recommendation)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [req.params.id, data.rating, data.strengths, data.concerns, data.recommendation]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  if (error.code === '23505') {
    return res.status(409).json({ error: 'Email already exists' });
  }

  if (error.code === '23503') {
    return res.status(404).json({ error: 'Related record not found' });
  }

  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
