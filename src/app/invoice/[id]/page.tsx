'use client'

import { useState, useEffect } from 'react'
import { notFound, useParams } from 'next/navigation'

interface Invoice {
  invoiceId: string
  date: string
  dueDate: string
  clientInfo: {
    name: string
    email: string
    phone: string
    address: string
    companyName?: string
    taxId?: string
  }
  freelancerInfo: {
    name: string
    email: string
    phone: string
    address: string
    website?: string
    companyName?: string
    taxId?: string
  }
  items: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
    taxRate?: number
    taxAmount?: number
  }>
  subtotal: number
  taxTotal: number
  total: number
  currency: string
  paymentTerms: string
  notes?: string
  status: string
  qrCodeUrl?: string
}


export default function InvoicePage() {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const params = useParams()
  const receiptId = params?.id as string
  
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${params.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            notFound()
          }
          throw new Error('Failed to fetch invoice')
        }

        const data = await response.json()
        setInvoice(data.invoice)
      } catch (error: any) {
        setError(error.message || 'Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchInvoice()
    }
  }, [params.id])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invoice Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The requested invoice could not be found.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print/Action Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 print:hidden">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-medium text-gray-900">Invoice {invoice.invoiceId}</h1>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Print Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 print:py-0 print:px-0">
        <div className="bg-white shadow-lg rounded-lg print:shadow-none print:rounded-none">
          <div className="p-8 print:p-6">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-red-600 mb-2">INVOICE</h1>
              <p className="text-xl text-gray-600">Invoice #{invoice.invoiceId}</p>
              <div className="mt-4">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  invoice.status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : invoice.status === 'sent'
                    ? 'bg-blue-100 text-blue-800'
                    : invoice.status === 'overdue'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </div>
            </div>

            {/* From/To Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">FROM:</h3>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">{invoice.freelancerInfo.name}</p>
                  {invoice.freelancerInfo.companyName && (
                    <p className="text-gray-600">{invoice.freelancerInfo.companyName}</p>
                  )}
                  <p className="text-gray-600">{invoice.freelancerInfo.email}</p>
                  <p className="text-gray-600">{invoice.freelancerInfo.phone}</p>
                  <p className="text-gray-600">{invoice.freelancerInfo.address}</p>
                  {invoice.freelancerInfo.website && (
                    <p className="text-gray-600">{invoice.freelancerInfo.website}</p>
                  )}
                  {invoice.freelancerInfo.taxId && (
                    <p className="text-gray-600">Tax ID: {invoice.freelancerInfo.taxId}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">TO:</h3>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">{invoice.clientInfo.name}</p>
                  {invoice.clientInfo.companyName && (
                    <p className="text-gray-600">{invoice.clientInfo.companyName}</p>
                  )}
                  <p className="text-gray-600">{invoice.clientInfo.email}</p>
                  <p className="text-gray-600">{invoice.clientInfo.phone}</p>
                  <p className="text-gray-600">{invoice.clientInfo.address}</p>
                  {invoice.clientInfo.taxId && (
                    <p className="text-gray-600">Tax ID: {invoice.clientInfo.taxId}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Invoice Date</p>
                <p className="font-semibold">{new Date(invoice.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="font-semibold text-red-600">{new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Terms</p>
                <p className="font-semibold">{invoice.paymentTerms}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8 overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left">Description</th>
                    <th className="border border-gray-300 px-4 py-3 text-right">Qty</th>
                    <th className="border border-gray-300 px-4 py-3 text-right">Rate</th>
                    {invoice.items.some(item => item.taxRate && item.taxRate > 0) && (
                      <th className="border border-gray-300 px-4 py-3 text-right">Tax %</th>
                    )}
                    <th className="border border-gray-300 px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3">{item.description}</td>
                      <td className="border border-gray-300 px-4 py-3 text-right">{item.quantity}</td>
                      <td className="border border-gray-300 px-4 py-3 text-right">
                        {invoice.currency} {item.rate.toLocaleString()}
                      </td>
                      {invoice.items.some(i => i.taxRate && i.taxRate > 0) && (
                        <td className="border border-gray-300 px-4 py-3 text-right">
                          {item.taxRate ? `${item.taxRate}%` : '0%'}
                        </td>
                      )}
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                        {invoice.currency} {item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-full max-w-sm">
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">{invoice.currency} {invoice.subtotal.toLocaleString()}</span>
                  </div>
                  {invoice.taxTotal > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-semibold">{invoice.currency} {invoice.taxTotal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 bg-red-600 text-white px-4 rounded">
                    <span className="font-bold text-lg">Total:</span>
                    <span className="font-bold text-lg">{invoice.currency} {invoice.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes:</h3>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-end">
              <div>
                {invoice.qrCodeUrl && (
                  <div className="print:hidden">
                    <p className="text-sm text-gray-600 mb-2">Scan to view online:</p>
                    <img src={invoice.qrCodeUrl} alt="QR Code" className="w-20 h-20" />
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Thank you for your business!</p>
                {invoice.freelancerInfo.website && (
                  <p className="text-sm text-gray-600">{invoice.freelancerInfo.website}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
