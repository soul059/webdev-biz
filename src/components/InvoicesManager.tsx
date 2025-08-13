'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Invoice {
  _id: string
  invoiceId: string
  date: string
  dueDate: string
  clientInfo: {
    name: string
    email: string
    phone: string
    address: string
    companyName?: string
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
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  paymentTerms: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface Client {
  _id: string
  name: string
  email: string
  companyName?: string
}

export default function InvoicesManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [formData, setFormData] = useState({
    clientId: '',
    dueDate: '',
    items: [{ description: '', quantity: 1, rate: 0 }],
    currency: 'USD',
    paymentTerms: 'Net 30',
    notes: '',
    taxRate: 0,
    sendEmail: true
  })

  // Fetch invoices
  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices')
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices)
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    }
  }

  // Fetch clients
  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients)
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  useEffect(() => {
    Promise.all([fetchInvoices(), fetchClients()]).then(() => setLoading(false))
  }, [])

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
    const taxTotal = subtotal * (formData.taxRate / 100)
    const total = subtotal + taxTotal
    return { subtotal, taxTotal, total }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { subtotal, taxTotal, total } = calculateTotals()
    const selectedClient = clients.find(c => c._id === formData.clientId)
    
    if (!selectedClient) return

    const invoiceData = {
      clientInfo: {
        name: selectedClient.name,
        email: selectedClient.email,
        companyName: selectedClient.companyName || ''
      },
      dueDate: formData.dueDate,
      items: formData.items.map(item => ({
        ...item,
        amount: item.quantity * item.rate,
        taxRate: formData.taxRate,
        taxAmount: (item.quantity * item.rate) * (formData.taxRate / 100)
      })),
      subtotal,
      taxTotal,
      total,
      currency: formData.currency,
      paymentTerms: formData.paymentTerms,
      notes: formData.notes,
      status: 'draft' as const
    }

    try {
      const url = editingInvoice ? `/api/invoices/${editingInvoice._id}` : '/api/invoices'
      const method = editingInvoice ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      })

      if (response.ok) {
        fetchInvoices()
        resetForm()
      }
    } catch (error) {
      console.error('Failed to save invoice:', error)
    }
  }

  // Update invoice status
  const updateStatus = async (invoiceId: string, status: Invoice['status']) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        fetchInvoices()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  // Delete invoice
  const handleDelete = async (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          fetchInvoices()
        }
      } catch (error) {
        console.error('Failed to delete invoice:', error)
      }
    }
  }

  // Add item to form
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, rate: 0 }]
    })
  }

  // Remove item from form
  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  // Update item in form
  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = formData.items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    )
    setFormData({ ...formData, items: updatedItems })
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      clientId: '',
      dueDate: '',
      items: [{ description: '', quantity: 1, rate: 0 }],
      currency: 'USD',
      paymentTerms: 'Net 30',
      notes: '',
      taxRate: 0,
      sendEmail: true
    })
    setEditingInvoice(null)
    setIsCreating(false)
  }

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const { subtotal, taxTotal, total } = calculateTotals()

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage invoices for your clients.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            onClick={() => setIsCreating(true)}
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Create Invoice
          </button>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-96 overflow-y-auto">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
              </h3>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Client *</label>
                    <select
                      required
                      value={formData.clientId}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Select a client</option>
                      {clients.map(client => (
                        <option key={client._id} value={client._id}>
                          {client.name} {client.companyName && `(${client.companyName})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="Net 30">Net 30</option>
                      <option value="Net 15">Net 15</option>
                      <option value="Due on receipt">Due on receipt</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Items</label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Item
                    </button>
                  </div>
                  
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Rate"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 mr-2">
                          {formData.currency} {(item.quantity * item.rate).toFixed(2)}
                        </span>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-right space-y-1">
                    <div>Subtotal: {formData.currency} {subtotal.toFixed(2)}</div>
                    <div>Tax ({formData.taxRate}%): {formData.currency} {taxTotal.toFixed(2)}</div>
                    <div className="font-bold">Total: {formData.currency} {total.toFixed(2)}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                {/* Email Notification Option */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sendEmail"
                      checked={formData.sendEmail}
                      onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="sendEmail" className="ml-2 block text-sm text-gray-900">
                      Send email notification to client
                    </label>
                  </div>
                  {formData.clientId && (
                    <p className="mt-1 text-xs text-gray-500">
                      Email will be sent to the selected client
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                  >
                    {editingInvoice ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {invoices.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No invoices found. Create your first invoice to get started.
            </li>
          ) : (
            invoices.map((invoice) => (
              <li key={invoice._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          Invoice #{invoice.invoiceId}
                        </p>
                        <p className="text-sm text-gray-500">
                          {invoice.clientInfo.name} • {invoice.currency} {invoice.total.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex space-x-2">
                    <Link 
                      href={`/invoice/${invoice._id}`}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      View
                    </Link>
                    {invoice.status === 'draft' && (
                      <button
                        onClick={() => updateStatus(invoice._id, 'sent')}
                        className="text-green-600 hover:text-green-900 text-sm font-medium"
                      >
                        Send
                      </button>
                    )}
                    {invoice.status === 'sent' && (
                      <button
                        onClick={() => updateStatus(invoice._id, 'paid')}
                        className="text-green-600 hover:text-green-900 text-sm font-medium"
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(invoice._id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
