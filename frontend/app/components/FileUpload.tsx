'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'

interface FileUploadProps {
  title: string
  description: string
  accept: string
  multiple: boolean
  onUpload: (files: File[]) => void
  icon?: React.ReactNode
}

export default function FileUpload({ 
  title, 
  description, 
  accept, 
  multiple, 
  onUpload, 
  icon 
}: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles)
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.split(',').reduce((acc, type) => {
      acc[type.trim()] = []
      return acc
    }, {} as Record<string, string[]>),
    multiple,
  })

  return (
    <div className="card">
      <div className="text-center mb-4">
        <div className="flex justify-center mb-3">
          {icon || <Upload className="w-8 h-8 text-primary-600" />}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        
        {isDragActive ? (
          <p className="text-primary-600 font-medium">
            Drop the files here...
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-600">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Accepted formats: {accept}
            </p>
            {multiple && (
              <p className="text-sm text-gray-500">
                Multiple files supported
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}