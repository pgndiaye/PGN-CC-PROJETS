import express from 'express';
import authRoutes from './routes/auth.routes.js';

const app = express();
app.use(express.json({ limit: '10kb' }));

app.use('/api/v1/auth', authRoutes);

const PORT = process.env['PORT'] ?? 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
