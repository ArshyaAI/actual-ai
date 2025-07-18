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

// Serve simple HTML page (for production)
if (process.env.NODE_ENV === 'production') {
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Swiss Bookkeeping Agent</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 800px; margin: 0 auto; }
          .flag { font-size: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1><span class="flag">🇨🇭</span> Swiss Bookkeeping Agent</h1>
          <p>AI-powered Swiss accounting solution is running!</p>
          <h2>API Endpoints:</h2>
          <ul>
            <li><a href="/api/health">Health Check</a></li>
            <li><a href="/api/test-claude">Test Claude API</a></li>
            <li><strong>POST /api/process-documents</strong> - Process documents</li>
          </ul>
          <p>Your Claude API key: ${process.env.ANTHROPIC_API_KEY ? 'Configured ✅' : 'Missing ❌'}</p>
        </div>
      </body>
      </html>
    `);
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