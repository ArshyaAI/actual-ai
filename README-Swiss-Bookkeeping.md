# 🇨🇭 Swiss Bookkeeping Agent

An AI-powered Swiss accounting and bookkeeping solution built with Claude API. This application automatically processes financial documents (invoices, receipts, bank statements) and categorizes transactions according to Swiss accounting standards.

## Features

### 📄 Document Processing
- **Multi-format support**: PDF, CSV, JPG, PNG, TXT
- **OCR integration**: Extract text from images and PDFs
- **Automatic classification**: Invoices, receipts, bank statements
- **Batch processing**: Handle multiple documents simultaneously

### 🧠 Swiss Accounting Intelligence
- **Swiss GAAP compliance**: Follows Swiss accounting standards
- **VAT calculation**: Automatic VAT rates (7.7%, 2.5%, 3.7%)
- **Chart of accounts**: Custom CSV import support
- **Account numbering**: Swiss standard (1000-9999)
- **Currency handling**: CHF (Swiss Francs)

### 📊 Reporting & Export
- **General ledger**: Complete transaction records
- **Tax reports**: VAT-compliant tax reporting
- **Compliance reports**: Swiss regulation validation
- **Audit trails**: Complete processing history
- **CSV exports**: All reports in CSV format

### 💻 Modern Web Interface
- **Drag & drop**: Easy file uploads
- **Real-time processing**: Live status updates
- **Responsive design**: Works on all devices
- **Swiss-themed UI**: Clean, professional interface

## Quick Start

### Prerequisites
- Node.js 18+
- Claude API key (Anthropic)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd swiss-bookkeeping-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your Claude API key
   ```

4. **Build the application**
   ```bash
   npm run build
   cd frontend && npm run build
   ```

5. **Start the server**
   ```bash
   npm start
   ```

Visit `http://localhost:3000` to use the application.

## Environment Variables

```env
# Required
ANTHROPIC_API_KEY=your_claude_api_key_here

# Optional
PORT=3000
NODE_ENV=production
FRONTEND_URL=http://localhost:3001
```

## Usage

### 1. Upload Chart of Accounts
Upload your chart of accounts as a CSV file with columns:
- Account Number
- Account Name  
- Account Type
- Parent Account (optional)

### 2. Upload Financial Documents
Upload invoices, receipts, and bank statements in supported formats:
- PDF files
- Image files (JPG, PNG)
- CSV files (for bank statements)
- Text files

### 3. Process Documents
Click "Process Documents" to start AI analysis. The system will:
- Extract text from documents
- Identify transaction data
- Apply Swiss accounting rules
- Generate compliance reports

### 4. Download Reports
Export the following reports:
- **General Ledger**: Complete transaction records
- **Tax Report**: VAT-compliant reporting
- **Compliance Report**: Validation results
- **Audit Trail**: Processing history

## Swiss Accounting Standards

The application follows Swiss accounting standards including:

- **Swiss GAAP FER**: Generally Accepted Accounting Principles
- **VAT Rates**: 7.7% (standard), 2.5% (reduced), 3.7% (special)
- **Account Structure**: 1000-9999 numbering system
- **Currency**: CHF (Swiss Francs)
- **KMU Standards**: Small and Medium Enterprise rules

## Deployment

### Railway
```bash
# Deploy to Railway
railway up
```

### Vercel
```bash
# Deploy to Vercel
vercel deploy
```

### Docker
```bash
# Build Docker image
docker build -t swiss-bookkeeping-agent .

# Run container
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=your_key swiss-bookkeeping-agent
```

## API Endpoints

### Document Processing
- `POST /api/process-documents` - Process uploaded documents
- `GET /api/processing-status/:resultId` - Check processing status

### Downloads
- `GET /api/download/general-ledger/:resultId` - Download general ledger
- `GET /api/download/tax-report/:resultId` - Download tax report
- `GET /api/download/compliance-report/:resultId` - Download compliance report
- `GET /api/download/audit-trail/:resultId` - Download audit trail

### Health Check
- `GET /api/health` - Service health status
- `GET /api/test-claude` - Test Claude API connection

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Claude API    │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (Anthropic)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   File Upload   │    │   Document      │
│   Component     │    │   Processor     │
└─────────────────┘    └─────────────────┘
                                │
                                ▼
                     ┌─────────────────┐
                     │   Swiss         │
                     │   Accounting    │
                     │   Intelligence  │
                     └─────────────────┘
                                │
                                ▼
                     ┌─────────────────┐
                     │   CSV           │
                     │   Formatter     │
                     └─────────────────┘
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the GitHub Issues
- Review the documentation
- Contact support

---

**🇨🇭 Built for Swiss businesses with Swiss precision**