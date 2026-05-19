import express from 'express';
import authRoutes from './routes/auth.routes.js';

const REQUIRED_ENV = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}

const app = express();
app.use(express.json({ limit: '10kb' }));

app.use('/api/v1/auth', authRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = process.env['PORT'] ?? 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
