import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import path from 'path';
import apiRoutes from './api/routes';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Swiss Bookkeeping Agent'
  });
});

// API routes
app.use('/api', apiRoutes);

// Serve static files from frontend build (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/out')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/out/index.html'));
  });
}

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🇨🇭 Swiss Bookkeeping Agent server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Claude API Key: ${process.env.ANTHROPIC_API_KEY ? 'Configured' : 'Missing'}`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`Frontend served from: ${path.join(__dirname, '../frontend/out')}`);
  }
});

export default app;