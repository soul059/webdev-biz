'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { downloadReceiptPDF, printReceiptPDF } from '@/lib/pdfGenerator'

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
    projectImages?: string[]
  }
  paymentInfo: {
    amount: number
    currency: string
    method: string
    status: string
    dueDate?: string
  }
}

export default function ReceiptPage() {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const params = useParams()
  const receiptId = params?.id as string

  useEffect(() => {
    if (receiptId) {
      fetchReceipt(receiptId)
    }
  }, [receiptId])

  const fetchReceipt = async (id: string) => {
    try {
      const response = await fetch(`/api/receipts/${id}`)
      
      if (!response.ok) {
        throw new Error('Receipt not found')
      }
      
      const data = await response.json()
      console.log('Received receipt data:', data) // Debug log
      
      // Ensure data structure integrity
      const safeData = {
        ...data,
        clientInfo: data.clientInfo || {},
        freelancerInfo: data.freelancerInfo || {},
        projectDetails: data.projectDetails || {},
        paymentInfo: data.paymentInfo || {}
      }
      
      setReceipt(safeData)
    } catch (error) {
      console.error('Fetch receipt error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load receipt')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading receipt...</p>
        </div>
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Receipt Not Found</h2>
          <p className="mt-2 text-gray-600">{error || 'The receipt you are looking for does not exist.'}</p>
          <a
            href="/"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    )
  }

  // Additional safety check for required data
  if (!receipt.clientInfo || !receipt.freelancerInfo || !receipt.projectDetails || !receipt.paymentInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading receipt data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Receipt</h1>
                <p className="text-gray-600">Receipt ID: {receipt.receiptId}</p>
                <p className="text-gray-600">Date: {new Date(receipt.date).toLocaleDateString()}</p>
              </div>
              {receipt.qrCodeUrl && (
                <div className="text-center">
                  <img 
                    src={receipt.qrCodeUrl} 
                    alt="QR Code" 
                    className="w-24 h-24 mx-auto border border-gray-200 rounded"
                    onError={(e) => {
                      console.error('QR Code failed to load:', receipt.qrCodeUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">QR Code</p>
                </div>
              )}
              {!receipt.qrCodeUrl && (
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No QR</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">QR Code</p>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">From</h3>
                <div className="text-gray-600">
                  <p className="font-medium">{receipt?.freelancerInfo?.name || 'N/A'}</p>
                  <p>{receipt?.freelancerInfo?.email || 'N/A'}</p>
                  <p>{receipt?.freelancerInfo?.phone || 'N/A'}</p>
                  <p>{receipt?.freelancerInfo?.address || 'N/A'}</p>
                  {receipt?.freelancerInfo?.website && (
                    <p>
                      <a 
                        href={receipt.freelancerInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {receipt?.freelancerInfo?.website}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">To</h3>
                <div className="text-gray-600">
                  <p className="font-medium">{receipt?.clientInfo?.name || 'N/A'}</p>
                  <p>{receipt?.clientInfo?.email || 'N/A'}</p>
                  <p>{receipt?.clientInfo?.phone || 'N/A'}</p>
                  <p>{receipt?.clientInfo?.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3 text-xl">{receipt?.projectDetails?.title || 'N/A'}</h4>
                <p className="text-gray-700 mb-4 leading-relaxed">{receipt?.projectDetails?.description || 'N/A'}</p>
                
                {receipt?.projectDetails?.websiteUrl && (
                  <div className="mb-4">
                    <span className="font-medium text-gray-900">Website: </span>
                    <a 
                      href={receipt.projectDetails.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {receipt.projectDetails.websiteUrl}
                    </a>
                  </div>
                )}
                
                {receipt?.projectDetails?.technologies && receipt.projectDetails.technologies.length > 0 && (
                  <div className="mb-4">
                    <span className="font-medium text-gray-900 block mb-2">Technologies Used:</span>
                    <div className="flex flex-wrap gap-2">
                      {receipt.projectDetails.technologies.map((tech, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {receipt?.projectDetails?.deliverables && receipt.projectDetails.deliverables.length > 0 && (
                  <div className="mb-4">
                    <span className="font-medium text-gray-900 block mb-2">Deliverables:</span>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {receipt.projectDetails.deliverables.map((deliverable, index) => (
                        <li key={index}>{deliverable}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {receipt?.projectDetails?.projectImages && receipt.projectDetails.projectImages.length > 0 && (
                  <div className="print:hidden">
                    <span className="font-medium text-gray-900 block mb-2">Project Images:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {receipt.projectDetails.projectImages.map((image, index) => (
                        <div key={index} className="border border-gray-300 rounded-lg overflow-hidden">
                          <img
                            src={image}
                            alt={`Project image ${index + 1}`}
                            className="w-full h-48 object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    receipt?.paymentInfo?.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : receipt?.paymentInfo?.status === 'partial'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {receipt?.paymentInfo?.status ? receipt.paymentInfo.status.charAt(0).toUpperCase() + receipt.paymentInfo.status.slice(1) : 'N/A'}
                </span>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-700 mb-2">
                      <span className="font-medium">Total Amount: </span>
                      <span className="text-xl font-bold text-green-600">
                        {receipt?.paymentInfo?.currency || 'USD'} {receipt?.paymentInfo?.amount ? receipt.paymentInfo.amount.toLocaleString() : '0'}
                      </span>
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Payment Method: </span>
                      {receipt.paymentInfo.method}
                    </p>
                  </div>
                  {receipt.paymentInfo.dueDate && (
                    <div>
                      <p className="text-gray-700">
                        <span className="font-medium">Due Date: </span>
                        {new Date(receipt.paymentInfo.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-sm text-gray-500 mb-4">
                This is a digitally generated receipt. For any queries, please contact{' '}
                {receipt?.freelancerInfo?.email ? (
                  <a 
                    href={`mailto:${receipt.freelancerInfo.email}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {receipt.freelancerInfo.email}
                  </a>
                ) : (
                  <span>the freelancer</span>
                )}
              </p>
              
              <div className="flex justify-center space-x-4 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                >
                  Print Page
                </button>
                <button
                  onClick={() => downloadReceiptPDF(receipt)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => printReceiptPDF(receipt)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium"
                >
                  Print PDF
                </button>
                <a
                  href="/"
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium"
                >
                  Back to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
