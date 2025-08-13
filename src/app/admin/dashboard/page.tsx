'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReceiptForm from '@/components/ReceiptForm'
import ClientsManager from '@/components/ClientsManager'
import InvoicesManager from '@/components/InvoicesManager'
import TemplatesManager from '@/components/TemplatesManager'
import SettingsManager from '@/components/SettingsManager'
import { downloadReceiptPDF } from '@/lib/pdfGenerator'

interface AnalyticsData {
  summary: {
    totalReceipts: number
    paidReceipts: number
    pendingReceipts: number
    partialReceipts: number
    totalRevenue: number
    primaryCurrency: string
    revenueByCurrency: Array<{
      _id: string
      totalRevenue: number
    }>
  }
  monthlyRevenue: Array<{
    _id: { year: number; month: number }
    revenue: number
    count: number
  }>
  recentReceipts: Array<{
    _id: string
    receiptId: string
    date: string
    paymentInfo: { amount: number; status: string; currency: string }
    clientInfo: { name: string }
  }>
}

interface Receipt {
  _id: string
  receiptId: string
  date: string
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
    status: 'paid' | 'pending' | 'partial'
    dueDate?: string
  }
  qrCodeUrl?: string
  pdfUrl?: string
  createdAt: string
  updatedAt: string
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'receipts' | 'config' | 'clients' | 'invoices' | 'templates' | 'settings'>('dashboard')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [receiptsLoading, setReceiptsLoading] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'partial'>('all')
  const [loading, setLoading] = useState(true)
  const [createLoading, setCreateLoading] = useState(false)
  const [configLoading, setConfigLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [freelancerConfig, setFreelancerConfig] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: ''
  })
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    
    fetchAnalytics()
  }, [router])

  useEffect(() => {
    if (activeTab === 'receipts') {
      fetchReceipts()
    }
  }, [activeTab, currentPage, statusFilter])

  useEffect(() => {
    if (activeTab === 'config') {
      fetchConfiguration()
    }
  }, [activeTab])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReceipts = async () => {
    setReceiptsLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/receipts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch receipts')
      }

      const data = await response.json()
      setReceipts(data.receipts)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error('Fetch receipts error:', error)
    } finally {
      setReceiptsLoading(false)
    }
  }

  const handleCreateReceipt = async (formData: any) => {
    setCreateLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      alert(`Receipt created successfully! Receipt ID: ${result.receipt.receiptId}`)
      setActiveTab('receipts')
      fetchAnalytics()
      fetchReceipts()
    } catch (error) {
      console.error('Create receipt error:', error)
      alert('Failed to create receipt. Please try again.')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDeleteReceipt = async (receiptId: string) => {
    if (!confirm('Are you sure you want to delete this receipt?')) {
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/receipts/${receiptId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete receipt')
      }

      alert('Receipt deleted successfully!')
      fetchReceipts()
      fetchAnalytics()
    } catch (error) {
      console.error('Delete receipt error:', error)
      alert('Failed to delete receipt. Please try again.')
    }
  }

  const handleViewReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setShowReceiptModal(true)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchReceipts()
  }

  const handleStatusFilterChange = (status: 'all' | 'paid' | 'pending' | 'partial') => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    router.push('/')
  }

  const fetchConfiguration = async () => {
    try {
      setConfigLoading(true)
      const token = localStorage.getItem('adminToken')
      
      const response = await fetch('/api/config', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setFreelancerConfig(data.freelancerInfo)
      } else {
        throw new Error('Failed to fetch configuration')
      }
    } catch (error) {
      console.error('Configuration fetch error:', error)
      alert('Failed to fetch configuration')
    } finally {
      setConfigLoading(false)
    }
  }

  const handleConfigUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setConfigLoading(true)
      const token = localStorage.getItem('adminToken')
      
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ freelancerInfo: freelancerConfig })
      })
      
      if (response.ok) {
        alert('Configuration updated successfully!')
      } else {
        throw new Error('Failed to update configuration')
      }
    } catch (error) {
      console.error('Configuration update error:', error)
      alert('Failed to update configuration')
    } finally {
      setConfigLoading(false)
    }
  }

  const handleResetConfig = async () => {
    if (!confirm('Are you sure you want to reset to default configuration?')) {
      return
    }

    try {
      setConfigLoading(true)
      const token = localStorage.getItem('adminToken')
      
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setFreelancerConfig(data.freelancerInfo)
        alert('Configuration reset to default!')
      } else {
        throw new Error('Failed to reset configuration')
      }
    } catch (error) {
      console.error('Configuration reset error:', error)
      alert('Failed to reset configuration')
    } finally {
      setConfigLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <nav className="flex space-x-6">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('create')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'create'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Create Receipt
                </button>
                <button
                  onClick={() => setActiveTab('receipts')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'receipts'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  All Receipts
                </button>
                <button
                  onClick={() => setActiveTab('config')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'config'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Configuration
                </button>
                <button
                  onClick={() => setActiveTab('clients')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'clients'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Clients
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'invoices'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Invoices
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'templates'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Templates
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Settings
                </button>
              </nav>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center space-x-2">
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-xs font-medium transition-colors"
              >
                Logout
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
                <button
                  onClick={() => {
                    setActiveTab('dashboard')
                    setMobileMenuOpen(false)
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setActiveTab('create')
                    setMobileMenuOpen(false)
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    activeTab === 'create'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Create Receipt
                </button>
                <button
                  onClick={() => {
                    setActiveTab('receipts')
                    setMobileMenuOpen(false)
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    activeTab === 'receipts'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All Receipts
                </button>
                <button
                  onClick={() => {
                    setActiveTab('config')
                    setMobileMenuOpen(false)
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    activeTab === 'config'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Configuration
                </button>
                <button
                  onClick={() => {
                    setActiveTab('clients')
                    setMobileMenuOpen(false)
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    activeTab === 'clients'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Clients
                </button>
                <button
                  onClick={() => {
                    setActiveTab('invoices')
                    setMobileMenuOpen(false)
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    activeTab === 'invoices'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Invoices
                </button>
                <button
                  onClick={() => {
                    setActiveTab('templates')
                    setMobileMenuOpen(false)
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    activeTab === 'templates'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Templates
                </button>
                <button
                  onClick={() => {
                    setActiveTab('settings')
                    setMobileMenuOpen(false)
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && analytics && (
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-semibold">R</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Receipts
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {analytics.summary.totalReceipts}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-semibold">{analytics.summary.primaryCurrency}</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Revenue
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {analytics.summary.primaryCurrency} {analytics.summary.totalRevenue.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-semibold">P</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Pending Payments
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {analytics.summary.pendingReceipts}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-semibold">C</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Paid Receipts
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {analytics.summary.paidReceipts}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Currency Breakdown */}
            {analytics.summary.revenueByCurrency && analytics.summary.revenueByCurrency.length > 1 && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Revenue by Currency
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics.summary.revenueByCurrency.map((curr, index) => (
                      <div key={curr._id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{curr._id}</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {curr._id} {curr.totalRevenue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Recent Receipts
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Receipt ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analytics.recentReceipts.map((receipt) => (
                        <tr key={receipt._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {receipt.receiptId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {receipt.clientInfo.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {receipt.paymentInfo.currency} {receipt.paymentInfo.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                receipt.paymentInfo.status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : receipt.paymentInfo.status === 'partial'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {receipt.paymentInfo.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(receipt.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New Receipt</h2>
              <p className="text-gray-600">Fill in the details to generate a new receipt with QR code</p>
            </div>
            <ReceiptForm onSubmit={handleCreateReceipt} loading={createLoading} />
          </div>
        )}

        {activeTab === 'receipts' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">All Receipts</h2>
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Create New Receipt
                </button>
              </div>

              {/* Search and Filter Section */}
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <form onSubmit={handleSearch} className="flex-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Search by receipt ID, client name, or project title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                      >
                        Search
                      </button>
                    </div>
                  </form>
                  
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => handleStatusFilterChange(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="partial">Partial</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipts Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {receiptsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading receipts...</span>
                </div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                    <span className="text-gray-400 text-xl">📄</span>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No receipts found</h3>
                  <p className="mt-2 text-gray-500">
                    {searchTerm || statusFilter !== 'all' ? 'No receipts match your search criteria.' : 'Get started by creating your first receipt.'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <button
                      onClick={() => setActiveTab('create')}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Create First Receipt
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Receipt ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Project
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {receipts.map((receipt) => (
                          <tr key={receipt._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {receipt.receiptId}
                              </div>
                              {receipt.qrCodeUrl && (
                                <div className="text-xs text-gray-500">
                                  QR Code Available
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {receipt.clientInfo.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {receipt.clientInfo.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {receipt.projectDetails.title}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {receipt.projectDetails.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {receipt.paymentInfo.currency} {receipt.paymentInfo.amount.toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                via {receipt.paymentInfo.method}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  receipt.paymentInfo.status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : receipt.paymentInfo.status === 'partial'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {receipt.paymentInfo.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(receipt.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-wrap gap-2 sm:space-x-2 sm:gap-0">
                                <button
                                  onClick={() => handleViewReceipt(receipt)}
                                  className="text-blue-600 hover:text-blue-900 px-1 py-1 rounded"
                                >
                                  View
                                </button>
                                <a
                                  href={`/receipt/${receipt.receiptId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-900 px-1 py-1 rounded"
                                >
                                  Public
                                </a>
                                <button
                                  onClick={() => downloadReceiptPDF(receipt)}
                                  className="text-purple-600 hover:text-purple-900 px-1 py-1 rounded"
                                  title="Download PDF"
                                >
                                  PDF
                                </button>
                                <button
                                  onClick={() => handleDeleteReceipt(receipt.receiptId)}
                                  className="text-red-600 hover:text-red-900 px-1 py-1 rounded"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing page <span className="font-medium">{currentPage}</span> of{' '}
                            <span className="font-medium">{totalPages}</span>
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                              Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === currentPage
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                              Next
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Receipt Detail Modal */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowReceiptModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Receipt Details</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Receipt ID: {selectedReceipt.receiptId}</h4>
                  <p className="text-gray-600">Date: {new Date(selectedReceipt.date).toLocaleDateString()}</p>
                </div>
                {selectedReceipt.qrCodeUrl && (
                  <div className="text-center">
                    <img 
                      src={selectedReceipt.qrCodeUrl} 
                      alt="QR Code" 
                      className="w-20 h-20 mx-auto"
                    />
                    <p className="text-xs text-gray-500 mt-1">QR Code</p>
                  </div>
                )}
              </div>

              {/* Client and Freelancer Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-3">Client Information</h5>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedReceipt.clientInfo.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedReceipt.clientInfo.email}</p>
                    <p><span className="font-medium">Phone:</span> {selectedReceipt.clientInfo.phone}</p>
                    <p><span className="font-medium">Address:</span> {selectedReceipt.clientInfo.address}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-3">Freelancer Information</h5>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedReceipt.freelancerInfo.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedReceipt.freelancerInfo.email}</p>
                    <p><span className="font-medium">Phone:</span> {selectedReceipt.freelancerInfo.phone}</p>
                    <p><span className="font-medium">Address:</span> {selectedReceipt.freelancerInfo.address}</p>
                    {selectedReceipt.freelancerInfo.website && (
                      <p><span className="font-medium">Website:</span> 
                        <a href={selectedReceipt.freelancerInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1">
                          {selectedReceipt.freelancerInfo.website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-semibold text-gray-900 mb-3">Project Details</h5>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900">{selectedReceipt.projectDetails.title}</p>
                    <p className="text-gray-700 mt-1">{selectedReceipt.projectDetails.description}</p>
                  </div>
                  
                  {selectedReceipt.projectDetails.websiteUrl && (
                    <div>
                      <span className="font-medium">Website: </span>
                      <a href={selectedReceipt.projectDetails.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {selectedReceipt.projectDetails.websiteUrl}
                      </a>
                    </div>
                  )}
                  
                  {selectedReceipt.projectDetails.technologies.length > 0 && (
                    <div>
                      <span className="font-medium">Technologies: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedReceipt.projectDetails.technologies.map((tech, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedReceipt.projectDetails.deliverables.length > 0 && (
                    <div className="mb-4">
                      <span className="font-medium">Deliverables: </span>
                      <ul className="list-disc list-inside mt-1 text-sm">
                        {selectedReceipt.projectDetails.deliverables.map((deliverable, index) => (
                          <li key={index}>{deliverable}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedReceipt.projectDetails.projectImages && selectedReceipt.projectDetails.projectImages.length > 0 && (
                    <div>
                      <span className="font-medium">Project Images: </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                        {selectedReceipt.projectDetails.projectImages.map((image: string, index: number) => (
                          <div key={index} className="border border-gray-300 rounded-lg overflow-hidden">
                            <img
                              src={image}
                              alt={`Project image ${index + 1}`}
                              className="w-full h-20 object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(image, '_blank')}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-semibold text-gray-900 mb-3">Payment Information</h5>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Amount:</span> 
                      <span className="text-lg font-bold text-green-600 ml-1">
                        {selectedReceipt.paymentInfo.currency} {selectedReceipt.paymentInfo.amount.toLocaleString()}
                      </span>
                    </p>
                    <p><span className="font-medium">Method:</span> {selectedReceipt.paymentInfo.method}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                        selectedReceipt.paymentInfo.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : selectedReceipt.paymentInfo.status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedReceipt.paymentInfo.status}
                      </span>
                    </p>
                  </div>
                  {selectedReceipt.paymentInfo.dueDate && (
                    <div>
                      <p className="text-sm"><span className="font-medium">Due Date:</span> {new Date(selectedReceipt.paymentInfo.dueDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <a
                  href={`/receipt/${selectedReceipt.receiptId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                >
                  View Public Receipt
                </a>
                <button
                  onClick={() => downloadReceiptPDF(selectedReceipt)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                  Freelancer Configuration
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Configure your default information that will be used as the "FROM" section in all receipts.
                </p>
                
                {configLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading configuration...</p>
                  </div>
                ) : (
                  <form onSubmit={handleConfigUpdate} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={freelancerConfig.name}
                          onChange={(e) => setFreelancerConfig(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={freelancerConfig.email}
                          onChange={(e) => setFreelancerConfig(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          value={freelancerConfig.phone}
                          onChange={(e) => setFreelancerConfig(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Website
                        </label>
                        <input
                          type="url"
                          value={freelancerConfig.website}
                          onChange={(e) => setFreelancerConfig(prev => ({ ...prev, website: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address *
                        </label>
                        <textarea
                          required
                          value={freelancerConfig.address}
                          onChange={(e) => setFreelancerConfig(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={handleResetConfig}
                        disabled={configLoading}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-md text-sm font-medium"
                      >
                        Reset to Default
                      </button>
                      
                      <button
                        type="submit"
                        disabled={configLoading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-sm font-medium"
                      >
                        {configLoading ? 'Saving...' : 'Save Configuration'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="px-4 py-6 sm:px-0">
            <ClientsManager />
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="px-4 py-6 sm:px-0">
            <InvoicesManager />
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="px-4 py-6 sm:px-0">
            <TemplatesManager />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="px-4 py-6 sm:px-0">
            <SettingsManager />
          </div>
        )}

    </div>
  )
}
