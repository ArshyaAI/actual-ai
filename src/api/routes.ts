import express from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import SwissBookkeepingService from '../swiss-bookkeeping-service';
import { formatError } from '../utils/error-utils';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.pdf', '.jpg', '.jpeg', '.png', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed`));
    }
  }
});

// Initialize Swiss bookkeeping service
const bookkeepingService = new SwissBookkeepingService();

// Store processing results in memory (in production, use Redis or database)
const processingResults = new Map<string, any>();

// Process documents endpoint
router.post('/process-documents', upload.fields([
  { name: 'chartOfAccounts', maxCount: 1 },
  { name: 'documents', maxCount: 20 }
]), async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files.chartOfAccounts || !files.documents) {
      return res.status(400).json({ 
        error: 'Chart of accounts and documents are required' 
      });
    }

    const chartOfAccountsFile = files.chartOfAccounts[0];
    const documentFiles = files.documents;

    console.log(`Processing ${documentFiles.length} documents with chart of accounts`);

    // Prepare document buffers
    const documentBuffers = documentFiles.map(file => ({
      buffer: file.buffer,
      fileName: file.originalname
    }));

    // Process documents using Swiss bookkeeping service
    const result = await bookkeepingService.processDocumentsFromBuffer(
      chartOfAccountsFile.buffer,
      documentBuffers
    );

    // Store result for later retrieval
    const resultId = `result-${Date.now()}`;
    processingResults.set(resultId, result);

    // Return result with ID for download links
    res.json({
      ...result,
      resultId,
      downloadLinks: {
        generalLedger: `/api/download/general-ledger/${resultId}`,
        taxReport: `/api/download/tax-report/${resultId}`,
        complianceReport: `/api/download/compliance-report/${resultId}`,
        auditTrail: `/api/download/audit-trail/${resultId}`
      }
    });

  } catch (error) {
    console.error('Error processing documents:', formatError(error));
    res.status(500).json({ 
      error: 'Internal server error',
      details: formatError(error)
    });
  }
});

// Download endpoints
router.get('/download/:type/:resultId', async (req, res) => {
  try {
    const { type, resultId } = req.params;
    
    const result = processingResults.get(resultId);
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    let filePath: string;
    let fileName: string;
    
    switch (type) {
      case 'general-ledger':
        filePath = result.exportFiles.generalLedger;
        fileName = 'general-ledger.csv';
        break;
      case 'tax-report':
        filePath = result.exportFiles.taxReport;
        fileName = 'tax-report.csv';
        break;
      case 'compliance-report':
        filePath = result.exportFiles.complianceReport;
        fileName = 'compliance-report.csv';
        break;
      case 'audit-trail':
        filePath = result.exportFiles.auditTrail;
        fileName = 'audit-trail.csv';
        break;
      default:
        return res.status(400).json({ error: 'Invalid download type' });
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Stream file to response
    const fileStream = await fs.readFile(filePath);
    res.send(fileStream);

  } catch (error) {
    console.error('Error downloading file:', formatError(error));
    res.status(500).json({ 
      error: 'Internal server error',
      details: formatError(error)
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Test Claude API endpoint
router.get('/test-claude', async (req, res) => {
  try {
    const { generateText } = await import('ai');
    const { anthropic } = await import('@ai-sdk/anthropic');
    
    const model = anthropic('claude-3-5-sonnet-20241022');

    const { text } = await generateText({
      model,
      prompt: 'Say "Swiss Bookkeeping Agent is ready!" in German',
      temperature: 0,
    });

    res.json({ 
      status: 'success',
      message: text,
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022'
    });

  } catch (error) {
    console.error('Error testing Claude API:', formatError(error));
    res.status(500).json({ 
      error: 'Claude API test failed',
      details: formatError(error)
    });
  }
});

// Get processing status (for real-time updates)
router.get('/processing-status/:resultId', (req, res) => {
  const { resultId } = req.params;
  
  const result = processingResults.get(resultId);
  if (!result) {
    return res.status(404).json({ error: 'Result not found' });
  }

  res.json({
    status: 'completed',
    progress: 100,
    summary: result.summary
  });
});

// Clean up old results (run periodically)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of processingResults.entries()) {
    // Remove results older than 1 hour
    if (now - parseInt(key.split('-')[1]) > 3600000) {
      processingResults.delete(key);
    }
  }
}, 300000); // Check every 5 minutes

export default router;