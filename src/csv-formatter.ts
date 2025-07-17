import { promises as fs } from 'fs';
import { CategorizedTransaction, ComplianceReport, AuditTrail } from './swiss-accounting-intelligence';
import { SwissChartOfAccounts } from './document-processor';

export interface CsvFormatterI {
  formatTransactionsForAccounting(transactions: CategorizedTransaction[]): Promise<string>;
  formatTransactionsForTax(transactions: CategorizedTransaction[]): Promise<string>;
  formatComplianceReport(report: ComplianceReport): Promise<string>;
  formatAuditTrail(auditTrail: AuditTrail): Promise<string>;
  exportToFile(content: string, fileName: string, outputDir: string): Promise<string>;
}

export interface SwissAccountingExport {
  generalLedger: string;
  taxReport: string;
  complianceReport: string;
  auditTrail: string;
}

class CsvFormatter implements CsvFormatterI {
  private readonly delimiter = ',';
  private readonly lineEnding = '\n';

  async formatTransactionsForAccounting(transactions: CategorizedTransaction[]): Promise<string> {
    console.log(`Formatting ${transactions.length} transactions for accounting`);
    
    const headers = [
      'Date',
      'Account Number',
      'Account Name',
      'Description',
      'Payee',
      'Reference',
      'Debit Amount',
      'Credit Amount',
      'Currency',
      'VAT Code',
      'VAT Rate',
      'VAT Amount',
      'Swiss GAAP Code',
      'Document Type',
      'Confidence',
      'Processing Notes'
    ];

    let csvContent = this.formatCsvRow(headers);

    for (const transaction of transactions) {
      const vatAmount = this.calculateVatAmount(transaction.amount, transaction.vatRate || 0);
      const isDebit = !transaction.isIncome;
      
      const row = [
        transaction.date,
        transaction.accountNumber,
        transaction.suggestedCategory,
        this.escapeCsvField(transaction.description),
        this.escapeCsvField(transaction.payee || ''),
        transaction.reference || '',
        isDebit ? transaction.amount.toFixed(2) : '0.00',
        isDebit ? '0.00' : transaction.amount.toFixed(2),
        'CHF',
        transaction.vatCode || '',
        transaction.vatRate?.toString() || '0',
        vatAmount.toFixed(2),
        transaction.swissGaapCode || '',
        this.getDocumentType(transaction),
        transaction.confidence.toFixed(2),
        this.escapeCsvField(transaction.notes)
      ];

      csvContent += this.formatCsvRow(row);
    }

    return csvContent;
  }

  async formatTransactionsForTax(transactions: CategorizedTransaction[]): Promise<string> {
    console.log(`Formatting ${transactions.length} transactions for tax reporting`);
    
    const headers = [
      'Period',
      'Transaction Date',
      'VAT Code',
      'VAT Rate (%)',
      'Net Amount',
      'VAT Amount',
      'Gross Amount',
      'Supplier/Customer',
      'Description',
      'Document Reference',
      'Account Number',
      'Deductible',
      'Tax Period'
    ];

    let csvContent = this.formatCsvRow(headers);

    for (const transaction of transactions) {
      const vatAmount = this.calculateVatAmount(transaction.amount, transaction.vatRate || 0);
      const netAmount = transaction.amount - vatAmount;
      const taxPeriod = this.getTaxPeriod(transaction.date);
      
      const row = [
        taxPeriod,
        transaction.date,
        transaction.vatCode || 'Standard',
        transaction.vatRate?.toString() || '7.7',
        netAmount.toFixed(2),
        vatAmount.toFixed(2),
        transaction.amount.toFixed(2),
        this.escapeCsvField(transaction.payee || ''),
        this.escapeCsvField(transaction.description),
        transaction.reference || '',
        transaction.accountNumber,
        this.isVatDeductible(transaction) ? 'Yes' : 'No',
        taxPeriod
      ];

      csvContent += this.formatCsvRow(row);
    }

    return csvContent;
  }

  async formatComplianceReport(report: ComplianceReport): Promise<string> {
    console.log('Formatting compliance report');
    
    let csvContent = 'Swiss Accounting Compliance Report\n\n';
    
    // Summary
    csvContent += 'Summary\n';
    csvContent += this.formatCsvRow(['Metric', 'Value']);
    csvContent += this.formatCsvRow(['Total Transactions', report.summary.totalTransactions.toString()]);
    csvContent += this.formatCsvRow(['Compliant Transactions', report.summary.compliantTransactions.toString()]);
    csvContent += this.formatCsvRow(['Compliance Rate', `${(report.summary.complianceRate * 100).toFixed(2)}%`]);
    csvContent += this.formatCsvRow(['Overall Compliance', report.isCompliant ? 'PASSED' : 'FAILED']);
    csvContent += '\n';

    // Violations
    if (report.violations.length > 0) {
      csvContent += 'Violations\n';
      csvContent += this.formatCsvRow(['Transaction ID', 'Type', 'Severity', 'Description', 'Suggestion']);
      
      for (const violation of report.violations) {
        csvContent += this.formatCsvRow([
          violation.transactionId,
          violation.type,
          violation.severity,
          this.escapeCsvField(violation.description),
          this.escapeCsvField(violation.suggestion)
        ]);
      }
      csvContent += '\n';
    }

    // Warnings
    if (report.warnings.length > 0) {
      csvContent += 'Warnings\n';
      csvContent += this.formatCsvRow(['Transaction ID', 'Type', 'Description', 'Suggestion']);
      
      for (const warning of report.warnings) {
        csvContent += this.formatCsvRow([
          warning.transactionId,
          warning.type,
          this.escapeCsvField(warning.description),
          this.escapeCsvField(warning.suggestion)
        ]);
      }
    }

    return csvContent;
  }

  async formatAuditTrail(auditTrail: AuditTrail): Promise<string> {
    console.log('Formatting audit trail');
    
    let csvContent = 'Swiss Accounting Audit Trail\n\n';
    
    // Metadata
    csvContent += 'Processing Information\n';
    csvContent += this.formatCsvRow(['Field', 'Value']);
    csvContent += this.formatCsvRow(['Processing ID', auditTrail.processingId]);
    csvContent += this.formatCsvRow(['Timestamp', auditTrail.timestamp.toISOString()]);
    csvContent += this.formatCsvRow(['System Version', auditTrail.systemInfo.version]);
    csvContent += this.formatCsvRow(['Processor', auditTrail.systemInfo.processor]);
    csvContent += this.formatCsvRow(['AI Model', auditTrail.systemInfo.aiModel]);
    csvContent += '\n';

    // Detailed audit entries
    csvContent += 'Transaction Processing Details\n';
    csvContent += this.formatCsvRow([
      'Transaction Date',
      'Original Description',
      'Final Category',
      'Account Number',
      'Amount',
      'Confidence',
      'Processing Steps',
      'AI Rationale'
    ]);

    for (const entry of auditTrail.transactions) {
      const processingSteps = entry.processingSteps
        .map(step => `${step.step}: ${step.result}`)
        .join(' | ');

      csvContent += this.formatCsvRow([
        entry.originalTransaction.date,
        this.escapeCsvField(entry.originalTransaction.description),
        entry.categorizedTransaction.suggestedCategory,
        entry.categorizedTransaction.accountNumber,
        entry.originalTransaction.amount.toFixed(2),
        entry.categorizedTransaction.confidence.toFixed(2),
        this.escapeCsvField(processingSteps),
        this.escapeCsvField(entry.aiDecisionRationale)
      ]);
    }

    return csvContent;
  }

  async exportToFile(content: string, fileName: string, outputDir: string): Promise<string> {
    const filePath = `${outputDir}/${fileName}`;
    
    try {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });
      
      // Write file with BOM for proper Swiss character encoding
      const bom = '\ufeff';
      await fs.writeFile(filePath, bom + content, 'utf8');
      
      console.log(`Exported to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error(`Error exporting to file: ${error}`);
      throw error;
    }
  }

  async exportCompleteAccountingPackage(
    transactions: CategorizedTransaction[],
    complianceReport: ComplianceReport,
    auditTrail: AuditTrail,
    outputDir: string
  ): Promise<SwissAccountingExport> {
    console.log('Exporting complete Swiss accounting package');
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    const generalLedger = await this.formatTransactionsForAccounting(transactions);
    const generalLedgerPath = await this.exportToFile(
      generalLedger,
      `general-ledger-${timestamp}.csv`,
      outputDir
    );

    const taxReport = await this.formatTransactionsForTax(transactions);
    const taxReportPath = await this.exportToFile(
      taxReport,
      `tax-report-${timestamp}.csv`,
      outputDir
    );

    const complianceReportCsv = await this.formatComplianceReport(complianceReport);
    const complianceReportPath = await this.exportToFile(
      complianceReportCsv,
      `compliance-report-${timestamp}.csv`,
      outputDir
    );

    const auditTrailCsv = await this.formatAuditTrail(auditTrail);
    const auditTrailPath = await this.exportToFile(
      auditTrailCsv,
      `audit-trail-${timestamp}.csv`,
      outputDir
    );

    return {
      generalLedger: generalLedgerPath,
      taxReport: taxReportPath,
      complianceReport: complianceReportPath,
      auditTrail: auditTrailPath
    };
  }

  private formatCsvRow(fields: string[]): string {
    return fields.join(this.delimiter) + this.lineEnding;
  }

  private escapeCsvField(field: string): string {
    if (!field) return '';
    
    // Escape quotes and wrap in quotes if contains delimiter, quotes, or newlines
    const escaped = field.replace(/"/g, '""');
    
    if (escaped.includes(this.delimiter) || escaped.includes('"') || escaped.includes('\n')) {
      return `"${escaped}"`;
    }
    
    return escaped;
  }

  private calculateVatAmount(amount: number, vatRate: number): number {
    // Swiss VAT calculation: VAT = (Amount * VAT Rate) / (100 + VAT Rate)
    return (amount * vatRate) / (100 + vatRate);
  }

  private getTaxPeriod(date: string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const quarter = Math.ceil((d.getMonth() + 1) / 3);
    return `${year}-Q${quarter}`;
  }

  private isVatDeductible(transaction: CategorizedTransaction): boolean {
    // Simplified logic for VAT deductibility
    return !transaction.isIncome && transaction.vatRate && transaction.vatRate > 0;
  }

  private getDocumentType(transaction: CategorizedTransaction): string {
    // Determine document type based on transaction data
    if (transaction.reference?.includes('INV')) return 'Invoice';
    if (transaction.reference?.includes('REC')) return 'Receipt';
    if (transaction.reference?.includes('BANK')) return 'Bank Statement';
    return 'Unknown';
  }
}

export default CsvFormatter;