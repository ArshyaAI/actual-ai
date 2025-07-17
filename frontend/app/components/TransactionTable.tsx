'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, Filter } from 'lucide-react'

interface Transaction {
  date: string
  description: string
  amount: number
  payee: string
  suggestedCategory: string
  accountNumber: string
  confidence: number
  vatRate: number
  isIncome: boolean
}

interface TransactionTableProps {
  transactions: Transaction[]
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<keyof Transaction>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [confidenceFilter, setConfidenceFilter] = useState<number>(0)

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesCategory = !filterCategory || transaction.suggestedCategory.toLowerCase().includes(filterCategory.toLowerCase())
    const matchesConfidence = transaction.confidence >= confidenceFilter
    return matchesCategory && matchesConfidence
  })

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Paginate transactions
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex)
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Filter by category..."
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field max-w-xs"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Min confidence:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(parseFloat(e.target.value))}
            className="w-20"
          />
          <span className="text-sm text-gray-600">{(confidenceFilter * 100).toFixed(0)}%</span>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {paginatedTransactions.length} of {sortedTransactions.length} transactions
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('date')}
              >
                Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('description')}
              >
                Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount')}
              >
                Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('suggestedCategory')}
              >
                Category {sortField === 'suggestedCategory' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="table-header">Account</th>
              <th className="table-header">VAT</th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('confidence')}
              >
                Confidence {sortField === 'confidence' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedTransactions.map((transaction, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="table-cell font-medium">
                  {new Date(transaction.date).toLocaleDateString('de-CH')}
                </td>
                <td className="table-cell">
                  <div className="max-w-xs truncate" title={transaction.description}>
                    {transaction.description}
                  </div>
                  {transaction.payee && (
                    <div className="text-xs text-gray-500 truncate">
                      {transaction.payee}
                    </div>
                  )}
                </td>
                <td className="table-cell">
                  <span className={`font-medium ${transaction.isIncome ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="font-medium">{transaction.suggestedCategory}</div>
                </td>
                <td className="table-cell">
                  <div className="text-sm font-mono">{transaction.accountNumber}</div>
                </td>
                <td className="table-cell">
                  <div className="text-sm">{transaction.vatRate}%</div>
                </td>
                <td className="table-cell">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(transaction.confidence)}`}>
                    {(transaction.confidence * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="table-cell">
                  <button className="text-primary-600 hover:text-primary-900">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalPages || 
                Math.abs(page - currentPage) <= 1
              )
              .map((page, index, array) => (
                <div key={page} className="flex items-center">
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                </div>
              ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}