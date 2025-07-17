import { promises as fs } from 'fs';
import { APIAccountEntity, APIPayeeEntity } from '@actual-app/api/@types/loot-core/src/server/api-models';
import { TransactionEntity } from '@actual-app/api/@types/loot-core/src/types/models';
import { LlmServiceI } from './types';

export interface DocumentProcessorI {
  processInvoice(filePath: string): Promise<ProcessedDocument>;
  processBankStatement(filePath: string): Promise<ProcessedDocument>;
  processReceipt(filePath: string): Promise<ProcessedDocument>;
  processChartOfAccounts(filePath: string): Promise<SwissChartOfAccounts>;
}

export interface ProcessedDocument {
  type: 'invoice' | 'receipt' | 'bank_statement';
  transactions: ExtractedTransaction[];
  metadata: DocumentMetadata;
}

export interface ExtractedTransaction {
  date: string;
  amount: number;
  description: string;
  payee?: string;
  account?: string;
  reference?: string;
  category?: string;
  isIncome: boolean;
}

export interface DocumentMetadata {
  fileName: string;
  processedAt: Date;
  confidence: number;
  documentLanguage: string;
  currency: string;
}

export interface SwissChartOfAccounts {
  accounts: SwissAccount[];
  categories: SwissCategory[];
  metadata: {
    standard: 'Swiss GAAP' | 'KMU' | 'Custom';
    year: number;
    company: string;
  };
}

export interface SwissAccount {
  accountNumber: string;
  accountName: string;
  accountType: 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses';
  parentAccount?: string;
  isActive: boolean;
}

export interface SwissCategory {
  categoryId: string;
  categoryName: string;
  accountNumber: string;
  description: string;
  swissGaapMapping?: string;
}

class DocumentProcessor implements DocumentProcessorI {
  private readonly llmService: LlmServiceI;

  constructor(llmService: LlmServiceI) {
    this.llmService = llmService;
  }

  async processInvoice(filePath: string): Promise<ProcessedDocument> {
    console.log(`Processing invoice: ${filePath}`);
    
    try {
      const fileBuffer = await fs.readFile(filePath);
      const fileName = filePath.split('/').pop() || 'unknown';
      
      // Extract text from document (would need OCR for images)
      const documentText = await this.extractTextFromFile(fileBuffer, fileName);
      
      // Use Claude to extract transaction data
      const prompt = this.buildInvoiceExtractionPrompt(documentText);
      const response = await this.llmService.ask(prompt);
      
      // Parse Claude's response to extract transaction data
      const extractedData = this.parseInvoiceResponse(response);
      
      return {
        type: 'invoice',
        transactions: extractedData.transactions,
        metadata: {
          fileName,
          processedAt: new Date(),
          confidence: extractedData.confidence,
          documentLanguage: extractedData.language,
          currency: extractedData.currency
        }
      };
    } catch (error) {
      console.error('Error processing invoice:', error);
      throw new Error(`Failed to process invoice: ${error}`);
    }
  }

  async processBankStatement(filePath: string): Promise<ProcessedDocument> {
    console.log(`Processing bank statement: ${filePath}`);
    
    try {
      const fileBuffer = await fs.readFile(filePath);
      const fileName = filePath.split('/').pop() || 'unknown';
      
      // For CSV bank statements, parse directly
      if (fileName.endsWith('.csv')) {
        return this.processCsvBankStatement(fileBuffer, fileName);
      }
      
      // For PDF/image bank statements, use OCR + LLM
      const documentText = await this.extractTextFromFile(fileBuffer, fileName);
      const prompt = this.buildBankStatementExtractionPrompt(documentText);
      const response = await this.llmService.ask(prompt);
      
      const extractedData = this.parseBankStatementResponse(response);
      
      return {
        type: 'bank_statement',
        transactions: extractedData.transactions,
        metadata: {
          fileName,
          processedAt: new Date(),
          confidence: extractedData.confidence,
          documentLanguage: extractedData.language,
          currency: extractedData.currency
        }
      };
    } catch (error) {
      console.error('Error processing bank statement:', error);
      throw new Error(`Failed to process bank statement: ${error}`);
    }
  }

  async processReceipt(filePath: string): Promise<ProcessedDocument> {
    console.log(`Processing receipt: ${filePath}`);
    
    try {
      const fileBuffer = await fs.readFile(filePath);
      const fileName = filePath.split('/').pop() || 'unknown';
      
      const documentText = await this.extractTextFromFile(fileBuffer, fileName);
      const prompt = this.buildReceiptExtractionPrompt(documentText);
      const response = await this.llmService.ask(prompt);
      
      const extractedData = this.parseReceiptResponse(response);
      
      return {
        type: 'receipt',
        transactions: extractedData.transactions,
        metadata: {
          fileName,
          processedAt: new Date(),
          confidence: extractedData.confidence,
          documentLanguage: extractedData.language,
          currency: extractedData.currency
        }
      };
    } catch (error) {
      console.error('Error processing receipt:', error);
      throw new Error(`Failed to process receipt: ${error}`);
    }
  }

  async processChartOfAccounts(filePath: string): Promise<SwissChartOfAccounts> {
    console.log(`Processing chart of accounts: ${filePath}`);
    
    try {
      const fileBuffer = await fs.readFile(filePath);
      const fileName = filePath.split('/').pop() || 'unknown';
      
      if (!fileName.endsWith('.csv')) {
        throw new Error('Chart of accounts must be in CSV format');
      }
      
      const csvContent = fileBuffer.toString('utf-8');
      const prompt = this.buildChartOfAccountsPrompt(csvContent);
      const response = await this.llmService.ask(prompt);
      
      return this.parseChartOfAccountsResponse(response);
    } catch (error) {
      console.error('Error processing chart of accounts:', error);
      throw new Error(`Failed to process chart of accounts: ${error}`);
    }
  }

  private async extractTextFromFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    // For now, assume text files. In production, you'd use OCR for images/PDFs
    if (fileName.endsWith('.txt') || fileName.endsWith('.csv')) {
      return fileBuffer.toString('utf-8');
    }
    
    // Placeholder for OCR implementation
    throw new Error('OCR not implemented yet. Please use text files for now.');
  }

  private async processCsvBankStatement(fileBuffer: Buffer, fileName: string): Promise<ProcessedDocument> {
    const csvContent = fileBuffer.toString('utf-8');
    const lines = csvContent.split('\n');
    const transactions: ExtractedTransaction[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(',');
      if (columns.length >= 4) {
        const date = columns[0]?.trim();
        const description = columns[1]?.trim();
        const amount = parseFloat(columns[2]?.trim() || '0');
        const reference = columns[3]?.trim();
        
        if (date && description && !isNaN(amount)) {
          transactions.push({
            date,
            description,
            amount: Math.abs(amount),
            reference,
            isIncome: amount > 0,
            payee: description
          });
        }
      }
    }
    
    return {
      type: 'bank_statement',
      transactions,
      metadata: {
        fileName,
        processedAt: new Date(),
        confidence: 0.95,
        documentLanguage: 'de',
        currency: 'CHF'
      }
    };
  }

  private buildInvoiceExtractionPrompt(documentText: string): string {
    return `You are a Swiss accounting expert. Extract transaction data from this invoice text in JSON format.

Document text:
${documentText}

Extract the following information:
1. Date (YYYY-MM-DD format)
2. Amount (positive number)
3. Description/Service
4. Payee/Vendor name
5. Invoice number
6. Currency (default CHF)
7. VAT amount if mentioned

Return JSON with this structure:
{
  "transactions": [{
    "date": "2024-01-15",
    "amount": 1200.50,
    "description": "Consulting services",
    "payee": "ABC Company",
    "reference": "INV-2024-001",
    "isIncome": false
  }],
  "confidence": 0.95,
  "language": "de",
  "currency": "CHF"
}

Be precise with Swiss date formats and currency.`;
  }

  private buildBankStatementExtractionPrompt(documentText: string): string {
    return `You are a Swiss banking expert. Extract all transactions from this bank statement text in JSON format.

Document text:
${documentText}

Extract each transaction with:
1. Date (YYYY-MM-DD format)
2. Amount (positive number)
3. Description
4. Reference number
5. Balance information if available
6. Determine if income (positive) or expense (negative)

Return JSON with this structure:
{
  "transactions": [{
    "date": "2024-01-15",
    "amount": 1200.50,
    "description": "Salary payment",
    "reference": "REF123456",
    "isIncome": true
  }],
  "confidence": 0.95,
  "language": "de",
  "currency": "CHF"
}

Handle Swiss banking formats and multiple currencies if present.`;
  }

  private buildReceiptExtractionPrompt(documentText: string): string {
    return `You are a Swiss retail expert. Extract transaction data from this receipt text in JSON format.

Document text:
${documentText}

Extract:
1. Date (YYYY-MM-DD format)
2. Total amount
3. Store/merchant name
4. Items purchased (if detailed)
5. VAT information
6. Payment method if mentioned

Return JSON with this structure:
{
  "transactions": [{
    "date": "2024-01-15",
    "amount": 45.80,
    "description": "Grocery shopping",
    "payee": "Migros",
    "reference": "receipt-001",
    "isIncome": false
  }],
  "confidence": 0.95,
  "language": "de",
  "currency": "CHF"
}

Handle Swiss retail formats and VAT calculations.`;
  }

  private buildChartOfAccountsPrompt(csvContent: string): string {
    return `You are a Swiss accounting expert. Parse this CSV chart of accounts and convert to structured format.

CSV content:
${csvContent}

Expected CSV columns: Account Number, Account Name, Account Type, Parent Account (optional)

Convert to Swiss accounting structure with:
1. Account numbers (Swiss standard numbering)
2. Account names (German/French/Italian)
3. Account types (Assets, Liabilities, Equity, Revenue, Expenses)
4. Parent-child relationships
5. Map to Swiss GAAP categories

Return JSON with this structure:
{
  "accounts": [{
    "accountNumber": "1000",
    "accountName": "Kasse",
    "accountType": "Assets",
    "parentAccount": "",
    "isActive": true
  }],
  "categories": [{
    "categoryId": "cat_1000",
    "categoryName": "Kasse",
    "accountNumber": "1000",
    "description": "Bargeld und Kassenbestand",
    "swissGaapMapping": "Current Assets"
  }],
  "metadata": {
    "standard": "Swiss GAAP",
    "year": 2024,
    "company": "Extracted from CSV"
  }
}

Follow Swiss accounting standards and numbering conventions.`;
  }

  private parseInvoiceResponse(response: any): any {
    // This would parse the JSON response from Claude
    // For now, return a mock structure
    return {
      transactions: [],
      confidence: 0.95,
      language: 'de',
      currency: 'CHF'
    };
  }

  private parseBankStatementResponse(response: any): any {
    return {
      transactions: [],
      confidence: 0.95,
      language: 'de',
      currency: 'CHF'
    };
  }

  private parseReceiptResponse(response: any): any {
    return {
      transactions: [],
      confidence: 0.95,
      language: 'de',
      currency: 'CHF'
    };
  }

  private parseChartOfAccountsResponse(response: any): SwissChartOfAccounts {
    return {
      accounts: [],
      categories: [],
      metadata: {
        standard: 'Swiss GAAP',
        year: 2024,
        company: 'Default'
      }
    };
  }
}

export default DocumentProcessor;