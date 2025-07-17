'use client'

import { AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react'

interface ComplianceViolation {
  transactionId: string
  type: string
  description: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  suggestion: string
}

interface ComplianceWarning {
  transactionId: string
  type: string
  description: string
  suggestion: string
}

interface ComplianceReport {
  isCompliant: boolean
  violations: ComplianceViolation[]
  warnings: ComplianceWarning[]
  summary: {
    totalTransactions: number
    compliantTransactions: number
    complianceRate: number
  }
}

interface ComplianceReportProps {
  report: ComplianceReport
}

export default function ComplianceReport({ report }: ComplianceReportProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'text-red-600 bg-red-100'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100'
      case 'LOW': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH': return <AlertCircle className="w-4 h-4" />
      case 'MEDIUM': return <AlertTriangle className="w-4 h-4" />
      case 'LOW': return <Info className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Info className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Total Transactions</h4>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {report.summary.totalTransactions}
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-900">Compliant</h4>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {report.summary.compliantTransactions}
          </p>
        </div>
        
        <div className={`p-4 rounded-lg ${report.isCompliant ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center space-x-2 mb-2">
            {report.isCompliant ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <h4 className={`font-semibold ${report.isCompliant ? 'text-green-900' : 'text-red-900'}`}>
              Compliance Rate
            </h4>
          </div>
          <p className={`text-2xl font-bold ${report.isCompliant ? 'text-green-900' : 'text-red-900'}`}>
            {(report.summary.complianceRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Violations */}
      {report.violations.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-red-900 mb-3 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>Compliance Violations ({report.violations.length})</span>
          </h4>
          
          <div className="space-y-3">
            {report.violations.map((violation, index) => (
              <div key={index} className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 p-1 rounded-full ${getSeverityColor(violation.severity)}`}>
                    {getSeverityIcon(violation.severity)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-red-900">
                        {violation.type.replace(/_/g, ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(violation.severity)}`}>
                        {violation.severity}
                      </span>
                    </div>
                    
                    <p className="text-sm text-red-800 mb-2">
                      {violation.description}
                    </p>
                    
                    <div className="bg-red-100 p-2 rounded text-sm">
                      <span className="font-medium text-red-900">Suggestion: </span>
                      <span className="text-red-800">{violation.suggestion}</span>
                    </div>
                    
                    <div className="mt-2 text-xs text-red-700">
                      Transaction ID: {violation.transactionId}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {report.warnings.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Warnings ({report.warnings.length})</span>
          </h4>
          
          <div className="space-y-3">
            {report.warnings.map((warning, index) => (
              <div key={index} className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  
                  <div className="flex-1">
                    <div className="font-semibold text-yellow-900 mb-1">
                      {warning.type.replace(/_/g, ' ')}
                    </div>
                    
                    <p className="text-sm text-yellow-800 mb-2">
                      {warning.description}
                    </p>
                    
                    <div className="bg-yellow-100 p-2 rounded text-sm">
                      <span className="font-medium text-yellow-900">Suggestion: </span>
                      <span className="text-yellow-800">{warning.suggestion}</span>
                    </div>
                    
                    <div className="mt-2 text-xs text-yellow-700">
                      Transaction ID: {warning.transactionId}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success State */}
      {report.isCompliant && report.violations.length === 0 && report.warnings.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Perfect Compliance!
          </h3>
          <p className="text-green-800">
            All transactions comply with Swiss accounting standards and regulations.
          </p>
        </div>
      )}

      {/* Swiss Compliance Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
          <Info className="w-5 h-5" />
          <span>Swiss Compliance Standards</span>
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Swiss GAAP FER accounting principles</li>
          <li>• VAT rates: 7.7% (standard), 2.5% (reduced), 3.7% (special)</li>
          <li>• Account numbering: 1000-9999 range</li>
          <li>• Date format: ISO 8601 (YYYY-MM-DD)</li>
          <li>• Currency: CHF (Swiss Francs)</li>
          <li>• KMU (SME) specific regulations</li>
        </ul>
      </div>
    </div>
  )
}