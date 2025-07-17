'use client'

import { useEffect, useState } from 'react'
import { FileText, Brain, CheckCircle, Clock } from 'lucide-react'

interface ProcessingStatusProps {
  isProcessing: boolean
  documents: File[]
}

interface ProcessingStep {
  name: string
  description: string
  status: 'pending' | 'processing' | 'completed'
  icon: React.ReactNode
}

export default function ProcessingStatus({ isProcessing, documents }: ProcessingStatusProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      name: 'Document Processing',
      description: 'Extracting text and data from uploaded documents',
      status: 'pending',
      icon: <FileText className="w-5 h-5" />
    },
    {
      name: 'AI Categorization',
      description: 'Applying Swiss accounting rules and AI categorization',
      status: 'pending',
      icon: <Brain className="w-5 h-5" />
    },
    {
      name: 'Compliance Check',
      description: 'Validating against Swiss GAAP and tax regulations',
      status: 'pending',
      icon: <CheckCircle className="w-5 h-5" />
    },
    {
      name: 'Report Generation',
      description: 'Creating audit trail and export files',
      status: 'pending',
      icon: <FileText className="w-5 h-5" />
    }
  ])

  useEffect(() => {
    if (!isProcessing) return

    const interval = setInterval(() => {
      setSteps(prevSteps => {
        const newSteps = [...prevSteps]
        
        // Update current step
        if (currentStep < newSteps.length) {
          newSteps[currentStep].status = 'processing'
          
          // Move to next step after some time
          setTimeout(() => {
            setSteps(steps => {
              const updatedSteps = [...steps]
              updatedSteps[currentStep].status = 'completed'
              return updatedSteps
            })
            setCurrentStep(prev => prev + 1)
          }, 3000)
        }
        
        return newSteps
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isProcessing, currentStep])

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Processing Your Documents
        </h2>
        <p className="text-gray-600">
          Processing {documents.length} documents with Swiss accounting AI
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              step.status === 'completed' 
                ? 'bg-green-100 text-green-600' 
                : step.status === 'processing'
                ? 'bg-primary-100 text-primary-600'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {step.status === 'completed' ? (
                <CheckCircle className="w-5 h-5" />
              ) : step.status === 'processing' ? (
                <div className="spinner" />
              ) : (
                step.icon
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`font-semibold ${
                  step.status === 'completed' 
                    ? 'text-green-600' 
                    : step.status === 'processing'
                    ? 'text-primary-600'
                    : 'text-gray-900'
                }`}>
                  {step.name}
                </h3>
                {step.status === 'processing' && (
                  <Clock className="w-4 h-4 text-primary-600" />
                )}
              </div>
              <p className="text-sm text-gray-600">
                {step.description}
              </p>
              
              {step.status === 'processing' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Processing Details</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• OCR text extraction from images and PDFs</li>
          <li>• Claude AI analysis for transaction categorization</li>
          <li>• Swiss VAT rate calculation (7.7%, 2.5%, 3.7%)</li>
          <li>• GAAP compliance validation</li>
          <li>• Audit trail generation</li>
        </ul>
      </div>
    </div>
  )
}