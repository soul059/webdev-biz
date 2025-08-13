'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface ReceiptData {
  receiptId: string
  date: string
  qrCodeUrl?: string
  pdfUrl?: string
  clientInfo: {
    name: string
    email: string
    phone: string
    address: string
  }
  freelancerInfo: {
    name: string
    email: string
    phone: string
    address: string
    website?: string
  }
  projectDetails: {
    title: string
    description: string
    technologies: string[]
    deliverables: string[]
    websiteUrl?: string
  }
  paymentInfo: {
    amount: number
    currency: string
    method: string
    status: string
    dueDate?: string
  }
}

export default function ReceiptViewer() {
  const [receiptId, setReceiptId] = useState('')
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const searchParams = useSearchParams()
  const urlReceiptId = searchParams?.get('id')

  const fetchReceipt = async (id: string) => {
    if (!id) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/receipts/${id}`)
      
      if (!response.ok) {
        throw new Error('Receipt not found')
      }
      
      const data = await response.json()
      setReceipt(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load receipt')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchReceipt(receiptId)
  }

  // Auto-fetch if URL has receipt ID
  if (urlReceiptId && !receipt && !loading) {
    fetchReceipt(urlReceiptId)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">View Receipt</h1>
          <p className="mt-2 text-gray-600">
            Enter your receipt ID to view your receipt details
          </p>
        </div>

        {!receipt && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <input
                type="text"
                value={receiptId}
                onChange={(e) => setReceiptId(e.target.value)}
                placeholder="Enter Receipt ID (e.g., RCP1234567890)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'View Receipt'}
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading receipt...</p>
          </div>
        )}

        {receipt && (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Receipt</h2>
                  <p className="text-gray-600">Receipt ID: {receipt.receiptId}</p>
                  <p className="text-gray-600">Date: {new Date(receipt.date).toLocaleDateString()}</p>
                </div>
                {receipt.qrCodeUrl && (
                  <div className="text-center">
                    <img 
                      src={receipt.qrCodeUrl} 
                      alt="QR Code" 
                      className="w-24 h-24 mx-auto"
                    />
                    <p className="text-xs text-gray-500 mt-1">QR Code</p>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">From</h3>
                  <div className="text-gray-600">
                    <p className="font-medium">{receipt.freelancerInfo.name}</p>
                    <p>{receipt.freelancerInfo.email}</p>
                    <p>{receipt.freelancerInfo.phone}</p>
                    <p>{receipt.freelancerInfo.address}</p>
                    {receipt.freelancerInfo.website && (
                      <p>
                        <a 
                          href={receipt.freelancerInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {receipt.freelancerInfo.website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">To</h3>
                  <div className="text-gray-600">
                    <p className="font-medium">{receipt.clientInfo.name}</p>
                    <p>{receipt.clientInfo.email}</p>
                    <p>{receipt.clientInfo.phone}</p>
                    <p>{receipt.clientInfo.address}</p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{receipt.projectDetails.title}</h4>
                  <p className="text-gray-600 mb-4">{receipt.projectDetails.description}</p>
                  
                  {receipt.projectDetails.websiteUrl && (
                    <p className="mb-4">
                      <span className="font-medium">Website: </span>
                      <a 
                        href={receipt.projectDetails.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {receipt.projectDetails.websiteUrl}
                      </a>
                    </p>
                  )}
                  
                  {receipt.projectDetails.technologies.length > 0 && (
                    <div className="mb-4">
                      <span className="font-medium">Technologies: </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {receipt.projectDetails.technologies.map((tech, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {receipt.projectDetails.deliverables.length > 0 && (
                    <div>
                      <span className="font-medium">Deliverables: </span>
                      <ul className="list-disc list-inside mt-1 text-gray-600">
                        {receipt.projectDetails.deliverables.map((deliverable, index) => (
                          <li key={index}>{deliverable}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      receipt.paymentInfo.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : receipt.paymentInfo.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {receipt.paymentInfo.status.charAt(0).toUpperCase() + receipt.paymentInfo.status.slice(1)}
                  </span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">Amount: </span>
                      {receipt.paymentInfo.currency} {receipt.paymentInfo.amount.toLocaleString()}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Payment Method: </span>
                      {receipt.paymentInfo.method}
                    </p>
                  </div>
                  {receipt.paymentInfo.dueDate && (
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Due Date: </span>
                        {new Date(receipt.paymentInfo.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t text-center">
                <p className="text-sm text-gray-500">
                  This is a digitally generated receipt. For any queries, please contact {receipt.freelancerInfo.email}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center mt-8">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
