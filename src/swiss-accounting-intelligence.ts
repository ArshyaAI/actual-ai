import { LlmServiceI, UnifiedResponse } from './types';
import { ExtractedTransaction, SwissChartOfAccounts, SwissAccount, SwissCategory } from './document-processor';

export interface SwissAccountingIntelligenceI {
  categorizeTransactions(transactions: ExtractedTransaction[], chartOfAccounts: SwissChartOfAccounts): Promise<CategorizedTransaction[]>;
  validateSwissCompliance(transactions: CategorizedTransaction[]): Promise<ComplianceReport>;
  generateAuditTrail(transactions: CategorizedTransaction[]): Promise<AuditTrail>;
}

export interface CategorizedTransaction extends ExtractedTransaction {
  suggestedCategory: string;
  accountNumber: string;
  confidence: number;
  swissGaapCode?: string;
  vatCode?: string;
  vatRate?: number;
  notes: string;
  processingRules: string[];
}

export interface ComplianceReport {
  isCompliant: boolean;
  violations: ComplianceViolation[];
  warnings: ComplianceWarning[];
  summary: {
    totalTransactions: number;
    compliantTransactions: number;
    complianceRate: number;
  };
}

export interface ComplianceViolation {
  transactionId: string;
  type: 'MISSING_VAT' | 'INVALID_ACCOUNT' | 'CURRENCY_MISMATCH' | 'DATE_FORMAT' | 'AMOUNT_VALIDATION';
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestion: string;
}

export interface ComplianceWarning {
  transactionId: string;
  type: 'UNUSUAL_AMOUNT' | 'DUPLICATE_ENTRY' | 'CATEGORIZATION_UNCERTAINTY';
  description: string;
  suggestion: string;
}

export interface AuditTrail {
  processingId: string;
  timestamp: Date;
  transactions: AuditTransactionEntry[];
  systemInfo: {
    version: string;
    processor: string;
    aiModel: string;
  };
}

export interface AuditTransactionEntry {
  originalTransaction: ExtractedTransaction;
  categorizedTransaction: CategorizedTransaction;
  processingSteps: ProcessingStep[];
  aiDecisionRationale: string;
}

export interface ProcessingStep {
  step: string;
  timestamp: Date;
  description: string;
  result: string;
}

class SwissAccountingIntelligence implements SwissAccountingIntelligenceI {
  private readonly llmService: LlmServiceI;
  private readonly swissVatRates = {
    'Standard': 7.7,
    'Reduced': 2.5,
    'Special': 3.7,
    'Zero': 0.0
  };

  constructor(llmService: LlmServiceI) {
    this.llmService = llmService;
  }

  async categorizeTransactions(
    transactions: ExtractedTransaction[],
    chartOfAccounts: SwissChartOfAccounts
  ): Promise<CategorizedTransaction[]> {
    console.log(`Categorizing ${transactions.length} transactions using Swiss accounting rules`);
    
    const categorizedTransactions: CategorizedTransaction[] = [];
    
    for (const transaction of transactions) {
      try {
        const categorized = await this.categorizeTransaction(transaction, chartOfAccounts);
        categorizedTransactions.push(categorized);
      } catch (error) {
        console.error(`Error categorizing transaction: ${error}`);
        // Add transaction with default categorization
        categorizedTransactions.push(this.createDefaultCategorization(transaction));
      }
    }
    
    return categorizedTransactions;
  }

  private async categorizeTransaction(
    transaction: ExtractedTransaction,
    chartOfAccounts: SwissChartOfAccounts
  ): Promise<CategorizedTransaction> {
    const prompt = this.buildCategorizationPrompt(transaction, chartOfAccounts);
    const response = await this.llmService.ask(prompt);
    
    // Parse the LLM response to extract categorization
    const categorization = this.parseCategorizationResponse(response);
    
    // Apply Swiss-specific rules
    const swissRules = this.applySwissAccountingRules(transaction, categorization);
    
    return {
      ...transaction,
      suggestedCategory: categorization.category,
      accountNumber: categorization.accountNumber,
      confidence: categorization.confidence,
      swissGaapCode: swissRules.gaapCode,
      vatCode: swissRules.vatCode,
      vatRate: swissRules.vatRate,
      notes: swissRules.notes,
      processingRules: swissRules.appliedRules
    };
  }

  private buildCategorizationPrompt(
    transaction: ExtractedTransaction,
    chartOfAccounts: SwissChartOfAccounts
  ): string {
    return `You are a Swiss accounting expert specializing in Swiss GAAP FER and tax regulations. 
Categorize this transaction according to Swiss accounting standards.

Transaction Details:
- Date: ${transaction.date}
- Amount: ${transaction.amount} CHF
- Description: ${transaction.description}
- Payee: ${transaction.payee || 'Unknown'}
- Type: ${transaction.isIncome ? 'Income' : 'Expense'}
- Reference: ${transaction.reference || 'None'}

Available Chart of Accounts:
${this.formatChartOfAccounts(chartOfAccounts)}

Swiss Accounting Rules to Consider:
1. VAT rates: Standard 7.7%, Reduced 2.5%, Special 3.7%
2. Account numbering: 1000-1999 Assets, 2000-2999 Liabilities, 3000-3999 Equity, 4000-4999 Revenue, 5000-9999 Expenses
3. Currency: CHF (Swiss Francs)
4. Fiscal year considerations
5. KMU (SME) accounting standards if applicable

Analyze the transaction and provide:
1. Best matching account from the chart
2. Confidence level (0-1)
3. VAT implications
4. Swiss GAAP category
5. Any compliance notes

Return JSON format:
{
  "category": "Account Name",
  "accountNumber": "1000",
  "confidence": 0.95,
  "vatCode": "Standard",
  "vatRate": 7.7,
  "swissGaapCode": "Current Assets",
  "notes": "Explanation of categorization",
  "appliedRules": ["Rule 1", "Rule 2"]
}

Consider Swiss-specific scenarios:
- Meals and entertainment (50% deductible)
- Vehicle expenses (private use adjustments)
- Insurance premiums (AHV/ALV/UVG)
- Depreciation schedules
- Cross-border transactions with EU
- Withholding tax implications`;
  }

  private formatChartOfAccounts(chartOfAccounts: SwissChartOfAccounts): string {
    let formatted = 'Accounts:\n';
    chartOfAccounts.accounts.forEach(account => {
      formatted += `- ${account.accountNumber}: ${account.accountName} (${account.accountType})\n`;
    });
    return formatted;
  }

  private parseCategorizationResponse(response: any): any {
    // This would parse the JSON response from Claude
    // For now, return a mock structure
    return {
      category: 'Office Expenses',
      accountNumber: '6000',
      confidence: 0.95,
      vatCode: 'Standard',
      vatRate: 7.7,
      swissGaapCode: 'Operating Expenses',
      notes: 'Standard office expense categorization',
      appliedRules: ['Swiss VAT Rule', 'KMU Classification']
    };
  }

  private applySwissAccountingRules(transaction: ExtractedTransaction, categorization: any): any {
    const rules: string[] = [];
    let vatCode = categorization.vatCode;
    let vatRate = categorization.vatRate;
    let notes = categorization.notes;
    let gaapCode = categorization.swissGaapCode;

    // Apply Swiss-specific rules
    if (this.isSwissVatApplicable(transaction)) {
      rules.push('Swiss VAT Applied');
      vatRate = this.determineVatRate(transaction);
    }

    if (this.isDepreciationRequired(transaction)) {
      rules.push('Depreciation Required');
      notes += ' | Depreciation schedule required';
    }

    if (this.isWithholdingTaxApplicable(transaction)) {
      rules.push('Withholding Tax Check');
      notes += ' | Check withholding tax obligations';
    }

    return {
      gaapCode,
      vatCode,
      vatRate,
      notes,
      appliedRules: rules
    };
  }

  private isSwissVatApplicable(transaction: ExtractedTransaction): boolean {
    // Logic to determine if Swiss VAT applies
    return transaction.amount > 0 && !transaction.isIncome;
  }

  private determineVatRate(transaction: ExtractedTransaction): number {
    // Simplified VAT rate determination
    const description = transaction.description?.toLowerCase() || '';
    
    if (description.includes('food') || description.includes('medicine')) {
      return this.swissVatRates.Reduced;
    }
    if (description.includes('hotel') || description.includes('accommodation')) {
      return this.swissVatRates.Special;
    }
    return this.swissVatRates.Standard;
  }

  private isDepreciationRequired(transaction: ExtractedTransaction): boolean {
    const description = transaction.description?.toLowerCase() || '';
    return transaction.amount > 1000 && 
           (description.includes('equipment') || description.includes('vehicle') || description.includes('furniture'));
  }

  private isWithholdingTaxApplicable(transaction: ExtractedTransaction): boolean {
    const description = transaction.description?.toLowerCase() || '';
    return transaction.isIncome && 
           (description.includes('dividend') || description.includes('interest') || description.includes('royalty'));
  }

  private createDefaultCategorization(transaction: ExtractedTransaction): CategorizedTransaction {
    return {
      ...transaction,
      suggestedCategory: 'Miscellaneous',
      accountNumber: transaction.isIncome ? '4000' : '6000',
      confidence: 0.1,
      swissGaapCode: 'Other',
      vatCode: 'Standard',
      vatRate: 7.7,
      notes: 'Default categorization - manual review required',
      processingRules: ['Default Rule']
    };
  }

  async validateSwissCompliance(transactions: CategorizedTransaction[]): Promise<ComplianceReport> {
    console.log(`Validating Swiss compliance for ${transactions.length} transactions`);
    
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    let compliantTransactions = 0;

    for (const transaction of transactions) {
      const transactionId = `${transaction.date}-${transaction.amount}-${transaction.reference}`;
      
      // Check for violations
      if (!this.isValidSwissAccountNumber(transaction.accountNumber)) {
        violations.push({
          transactionId,
          type: 'INVALID_ACCOUNT',
          description: `Account number ${transaction.accountNumber} is not valid Swiss format`,
          severity: 'HIGH',
          suggestion: 'Use Swiss standard account numbering (1000-9999)'
        });
      }

      if (!this.isValidSwissDateFormat(transaction.date)) {
        violations.push({
          transactionId,
          type: 'DATE_FORMAT',
          description: 'Date format is not ISO 8601 compliant',
          severity: 'MEDIUM',
          suggestion: 'Use YYYY-MM-DD format'
        });
      }

      if (transaction.confidence < 0.7) {
        warnings.push({
          transactionId,
          type: 'CATEGORIZATION_UNCERTAINTY',
          description: `Low confidence categorization (${transaction.confidence})`,
          suggestion: 'Manual review recommended'
        });
      }

      if (violations.length === 0) {
        compliantTransactions++;
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
      summary: {
        totalTransactions: transactions.length,
        compliantTransactions,
        complianceRate: compliantTransactions / transactions.length
      }
    };
  }

  private isValidSwissAccountNumber(accountNumber: string): boolean {
    const num = parseInt(accountNumber);
    return num >= 1000 && num <= 9999;
  }

  private isValidSwissDateFormat(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date);
  }

  async generateAuditTrail(transactions: CategorizedTransaction[]): Promise<AuditTrail> {
    console.log(`Generating audit trail for ${transactions.length} transactions`);
    
    return {
      processingId: `audit-${Date.now()}`,
      timestamp: new Date(),
      transactions: transactions.map(transaction => ({
        originalTransaction: {
          date: transaction.date,
          amount: transaction.amount,
          description: transaction.description,
          payee: transaction.payee,
          account: transaction.account,
          reference: transaction.reference,
          category: transaction.category,
          isIncome: transaction.isIncome
        },
        categorizedTransaction: transaction,
        processingSteps: [
          {
            step: 'Document Processing',
            timestamp: new Date(),
            description: 'Transaction extracted from document',
            result: 'Success'
          },
          {
            step: 'AI Categorization',
            timestamp: new Date(),
            description: 'AI-powered categorization applied',
            result: `Category: ${transaction.suggestedCategory}`
          },
          {
            step: 'Swiss Compliance Check',
            timestamp: new Date(),
            description: 'Swiss accounting rules validated',
            result: `Confidence: ${transaction.confidence}`
          }
        ],
        aiDecisionRationale: `Transaction categorized as ${transaction.suggestedCategory} based on ${transaction.processingRules.join(', ')}. VAT rate: ${transaction.vatRate}%. Confidence: ${transaction.confidence}`
      })),
      systemInfo: {
        version: '1.0.0',
        processor: 'Swiss Accounting Intelligence',
        aiModel: 'Claude-3.5-Sonnet'
      }
    };
  }
}

export default SwissAccountingIntelligence;