'use client'

import { useState } from 'react'
import { Upload, FileText, BarChart3, Download, AlertCircle, CheckCircle } from 'lucide-react'
import FileUpload from './components/FileUpload'
import ProcessingStatus from './components/ProcessingStatus'
import TransactionTable from './components/TransactionTable'
import ComplianceReport from './components/ComplianceReport'
import toast from 'react-hot-toast'

interface ProcessingResult {
  transactions: any[]
  complianceReport: any
  auditTrail: any
  exportUrls: {
    generalLedger: string
    taxReport: string
    complianceReport: string
    auditTrail: string
  }
}

export default function Home() {
  const [step, setStep] = useState(1)
  const [chartOfAccounts, setChartOfAccounts] = useState<File | null>(null)
  const [documents, setDocuments] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<ProcessingResult | null>(null)

  const handleChartUpload = (file: File) => {
    setChartOfAccounts(file)
    toast.success('Chart of accounts uploaded successfully')
  }

  const handleDocumentUpload = (files: File[]) => {
    setDocuments(files)
    toast.success(`${files.length} documents uploaded successfully`)
  }

  const processDocuments = async () => {
    if (!chartOfAccounts || documents.length === 0) {
      toast.error('Please upload chart of accounts and documents')
      return
    }

    setProcessing(true)
    setStep(2)

    try {
      const formData = new FormData()
      formData.append('chartOfAccounts', chartOfAccounts)
      documents.forEach((doc, index) => {
        formData.append(`document_${index}`, doc)
      })

      const response = await fetch('/api/process-documents', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Processing failed')
      }

      const result = await response.json()
      setResults(result)
      setStep(3)
      toast.success('Documents processed successfully!')
    } catch (error) {
      toast.error('Error processing documents')
      console.error('Processing error:', error)
    } finally {
      setProcessing(false)
    }
  }

  const downloadReport = async (type: string) => {
    if (!results) return

    try {
      const response = await fetch(`/api/download/${type}`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(`${type} report downloaded`)
    } catch (error) {
      toast.error('Error downloading report')
      console.error('Download error:', error)
    }
  }

  const resetProcess = () => {
    setStep(1)
    setChartOfAccounts(null)
    setDocuments([])
    setResults(null)
    setProcessing(false)
  }

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
            <Upload className="w-4 h-4" />
          </div>
          <span className="font-medium">Upload Files</span>
        </div>
        
        <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
        
        <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
            <FileText className="w-4 h-4" />
          </div>
          <span className="font-medium">Process</span>
        </div>
        
        <div className={`w-16 h-0.5 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`} />
        
        <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className="font-medium">Results</span>
        </div>
      </div>

      {/* Step 1: File Upload */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Swiss Bookkeeping Agent
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Upload your chart of accounts and financial documents. Our AI will automatically 
              categorize transactions according to Swiss accounting standards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <FileUpload
              title="Chart of Accounts"
              description="Upload your chart of accounts in CSV format"
              accept=".csv"
              multiple={false}
              onUpload={(files) => handleChartUpload(files[0])}
              icon={<FileText className="w-8 h-8 text-primary-600" />}
            />
            
            <FileUpload
              title="Financial Documents"
              description="Upload invoices, receipts, and bank statements"
              accept=".pdf,.jpg,.png,.csv,.txt"
              multiple={true}
              onUpload={handleDocumentUpload}
              icon={<Upload className="w-8 h-8 text-primary-600" />}
            />
          </div>

          {chartOfAccounts && documents.length > 0 && (
            <div className="text-center">
              <button
                onClick={processDocuments}
                disabled={processing}
                className="btn-primary text-lg px-8 py-3"
              >
                {processing ? 'Processing...' : 'Process Documents'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Processing */}
      {step === 2 && (
        <div className="animate-fade-in">
          <ProcessingStatus 
            isProcessing={processing}
            documents={documents}
          />
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && results && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Processing Results
            </h2>
            <button
              onClick={resetProcess}
              className="btn-secondary"
            >
              Process New Documents
            </button>
          </div>

          {/* Compliance Status */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              {results.complianceReport.isCompliant ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
              <h3 className="text-lg font-semibold">
                Swiss Compliance Status
              </h3>
            </div>
            <ComplianceReport report={results.complianceReport} />
          </div>

          {/* Transactions Table */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">
              Categorized Transactions
            </h3>
            <TransactionTable transactions={results.transactions} />
          </div>

          {/* Export Options */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">
              Export Reports
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => downloadReport('general-ledger')}
                className="btn-primary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>General Ledger</span>
              </button>
              <button
                onClick={() => downloadReport('tax-report')}
                className="btn-primary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Tax Report</span>
              </button>
              <button
                onClick={() => downloadReport('compliance-report')}
                className="btn-primary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Compliance</span>
              </button>
              <button
                onClick={() => downloadReport('audit-trail')}
                className="btn-primary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Audit Trail</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}