import { promises as fs } from 'fs';
import path from 'path';
import DocumentProcessor, { DocumentProcessorI, ProcessedDocument, SwissChartOfAccounts } from './document-processor';
import SwissAccountingIntelligence, { SwissAccountingIntelligenceI, CategorizedTransaction } from './swiss-accounting-intelligence';
import CsvFormatter, { CsvFormatterI, SwissAccountingExport } from './csv-formatter';
import { LlmServiceI } from './types';
import { SimpleLlmService } from './simple-llm-service';

export interface SwissBookkeepingServiceI {
  processDocuments(chartOfAccountsPath: string, documentPaths: string[]): Promise<SwissBookkeepingResult>;
  processDocumentsFromBuffer(chartOfAccountsBuffer: Buffer, documentBuffers: Array<{buffer: Buffer, fileName: string}>): Promise<SwissBookkeepingResult>;
}

export interface SwissBookkeepingResult {
  transactions: CategorizedTransaction[];
  complianceReport: any;
  auditTrail: any;
  exportFiles: SwissAccountingExport;
  summary: {
    totalTransactions: number;
    totalAmount: number;
    complianceRate: number;
    processingTime: number;
  };
}

class SwissBookkeepingService implements SwissBookkeepingServiceI {
  private readonly documentProcessor: DocumentProcessorI;
  private readonly accountingIntelligence: SwissAccountingIntelligenceI;
  private readonly csvFormatter: CsvFormatterI;
  private readonly llmService: LlmServiceI;

  constructor() {
    this.llmService = new SimpleLlmService();
    this.documentProcessor = new DocumentProcessor(this.llmService);
    this.accountingIntelligence = new SwissAccountingIntelligence(this.llmService);
    this.csvFormatter = new CsvFormatter();
  }

  async processDocuments(
    chartOfAccountsPath: string,
    documentPaths: string[]
  ): Promise<SwissBookkeepingResult> {
    const startTime = Date.now();
    
    console.log(`Starting Swiss bookkeeping process with ${documentPaths.length} documents`);
    
    try {
      // Process chart of accounts
      const chartOfAccounts = await this.documentProcessor.processChartOfAccounts(chartOfAccountsPath);
      console.log(`Loaded chart of accounts with ${chartOfAccounts.accounts.length} accounts`);
      
      // Process all documents
      const processedDocuments: ProcessedDocument[] = [];
      
      for (const docPath of documentPaths) {
        const fileName = path.basename(docPath);
        console.log(`Processing document: ${fileName}`);
        
        try {
          let processedDoc: ProcessedDocument;
          
          if (fileName.toLowerCase().includes('invoice')) {
            processedDoc = await this.documentProcessor.processInvoice(docPath);
          } else if (fileName.toLowerCase().includes('receipt')) {
            processedDoc = await this.documentProcessor.processReceipt(docPath);
          } else if (fileName.toLowerCase().includes('bank') || fileName.toLowerCase().includes('statement')) {
            processedDoc = await this.documentProcessor.processBankStatement(docPath);
          } else {
            // Default to receipt processing
            processedDoc = await this.documentProcessor.processReceipt(docPath);
          }
          
          processedDocuments.push(processedDoc);
        } catch (error) {
          console.error(`Error processing document ${fileName}:`, error);
          // Continue with other documents
        }
      }
      
      // Extract all transactions
      const allTransactions = processedDocuments.flatMap(doc => doc.transactions);
      console.log(`Extracted ${allTransactions.length} transactions from documents`);
      
      // Apply Swiss accounting intelligence
      const categorizedTransactions = await this.accountingIntelligence.categorizeTransactions(
        allTransactions,
        chartOfAccounts
      );
      
      // Generate compliance report
      const complianceReport = await this.accountingIntelligence.validateSwissCompliance(
        categorizedTransactions
      );
      
      // Generate audit trail
      const auditTrail = await this.accountingIntelligence.generateAuditTrail(
        categorizedTransactions
      );
      
      // Export to CSV files
      const outputDir = path.join(process.cwd(), 'exports');
      const exportFiles = await this.csvFormatter.exportCompleteAccountingPackage(
        categorizedTransactions,
        complianceReport,
        auditTrail,
        outputDir
      );
      
      const processingTime = Date.now() - startTime;
      const totalAmount = categorizedTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      const result: SwissBookkeepingResult = {
        transactions: categorizedTransactions,
        complianceReport,
        auditTrail,
        exportFiles,
        summary: {
          totalTransactions: categorizedTransactions.length,
          totalAmount,
          complianceRate: complianceReport.summary.complianceRate,
          processingTime
        }
      };
      
      console.log(`Swiss bookkeeping process completed in ${processingTime}ms`);
      console.log(`- ${result.summary.totalTransactions} transactions processed`);
      console.log(`- Total amount: CHF ${totalAmount.toFixed(2)}`);
      console.log(`- Compliance rate: ${(result.summary.complianceRate * 100).toFixed(1)}%`);
      
      return result;
      
    } catch (error) {
      console.error('Error in Swiss bookkeeping process:', error);
      throw error;
    }
  }

  async processDocumentsFromBuffer(
    chartOfAccountsBuffer: Buffer,
    documentBuffers: Array<{buffer: Buffer, fileName: string}>
  ): Promise<SwissBookkeepingResult> {
    const startTime = Date.now();
    
    console.log(`Starting Swiss bookkeeping process with ${documentBuffers.length} document buffers`);
    
    try {
      // Create temporary files for processing
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.mkdir(tempDir, { recursive: true });
      
      // Write chart of accounts to temp file
      const chartPath = path.join(tempDir, 'chart-of-accounts.csv');
      await fs.writeFile(chartPath, chartOfAccountsBuffer);
      
      // Write documents to temp files
      const documentPaths: string[] = [];
      for (const doc of documentBuffers) {
        const docPath = path.join(tempDir, doc.fileName);
        await fs.writeFile(docPath, doc.buffer);
        documentPaths.push(docPath);
      }
      
      // Process documents using file-based method
      const result = await this.processDocuments(chartPath, documentPaths);
      
      // Clean up temporary files
      await this.cleanupTempFiles(tempDir);
      
      return result;
      
    } catch (error) {
      console.error('Error in Swiss bookkeeping process from buffers:', error);
      throw error;
    }
  }

  private async cleanupTempFiles(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up temporary files:', error);
    }
  }
}

export default SwissBookkeepingService;