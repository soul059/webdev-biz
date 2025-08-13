'use client'

import { useState, useEffect } from 'react'

interface Currency {
  _id: string
  code: string
  name: string
  symbol: string
  exchangeRate: number
  isActive: boolean
}

interface TaxSetting {
  _id: string
  name: string
  description: string
  rate: number
  type: 'percentage' | 'fixed'
  region: string
  applicableTo: string[]
  isActive: boolean
}

interface EmailTemplate {
  _id: string
  name: string
  type: string
  subject: string
  htmlBody: string
  isActive: boolean
}

export default function SettingsManager() {
  const [activeSection, setActiveSection] = useState<'currencies' | 'taxes' | 'email'>('currencies')
  
  // Currencies
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [currencyForm, setCurrencyForm] = useState({
    code: '',
    name: '',
    symbol: '',
    exchangeRate: 1,
    isActive: true
  })
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)
  const [showCurrencyForm, setShowCurrencyForm] = useState(false)

  // Tax Settings
  const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([])
  const [taxForm, setTaxForm] = useState({
    name: '',
    description: '',
    rate: 0,
    type: 'percentage' as 'percentage' | 'fixed',
    region: '',
    applicableTo: ['receipt', 'invoice'],
    isActive: true
  })
  const [editingTax, setEditingTax] = useState<TaxSetting | null>(null)
  const [showTaxForm, setShowTaxForm] = useState(false)

  // Email Templates
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [emailForm, setEmailForm] = useState({
    name: '',
    type: '',
    subject: '',
    htmlBody: '',
    isActive: true
  })
  const [editingEmail, setEditingEmail] = useState<EmailTemplate | null>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)

  const [loading, setLoading] = useState(true)

  // Fetch data
  const fetchCurrencies = async () => {
    try {
      const response = await fetch('/api/currencies')
      if (response.ok) {
        const data = await response.json()
        setCurrencies(data.currencies)
      }
    } catch (error) {
      console.error('Failed to fetch currencies:', error)
    }
  }

  const fetchTaxSettings = async () => {
    try {
      const response = await fetch('/api/tax-settings')
      if (response.ok) {
        const data = await response.json()
        setTaxSettings(data.taxSettings)
      }
    } catch (error) {
      console.error('Failed to fetch tax settings:', error)
    }
  }

  const fetchEmailTemplates = async () => {
    try {
      const response = await fetch('/api/email/templates')
      if (response.ok) {
        const data = await response.json()
        setEmailTemplates(data.templates)
      }
    } catch (error) {
      console.error('Failed to fetch email templates:', error)
    }
  }

  useEffect(() => {
    Promise.all([fetchCurrencies(), fetchTaxSettings(), fetchEmailTemplates()])
      .then(() => setLoading(false))
  }, [])

  // Currency handlers
  const handleCurrencySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingCurrency ? `/api/currencies/${editingCurrency._id}` : '/api/currencies'
      const method = editingCurrency ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currencyForm)
      })

      if (response.ok) {
        fetchCurrencies()
        resetCurrencyForm()
      }
    } catch (error) {
      console.error('Failed to save currency:', error)
    }
  }

  const deleteCurrency = async (id: string) => {
    if (confirm('Are you sure you want to delete this currency?')) {
      try {
        const response = await fetch(`/api/currencies/${id}`, { method: 'DELETE' })
        if (response.ok) fetchCurrencies()
      } catch (error) {
        console.error('Failed to delete currency:', error)
      }
    }
  }

  const editCurrency = (currency: Currency) => {
    setEditingCurrency(currency)
    setCurrencyForm({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchangeRate: currency.exchangeRate,
      isActive: currency.isActive
    })
    setShowCurrencyForm(true)
  }

  const resetCurrencyForm = () => {
    setCurrencyForm({ code: '', name: '', symbol: '', exchangeRate: 1, isActive: true })
    setEditingCurrency(null)
    setShowCurrencyForm(false)
  }

  // Tax handlers
  const handleTaxSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingTax ? `/api/tax-settings/${editingTax._id}` : '/api/tax-settings'
      const method = editingTax ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taxForm)
      })

      if (response.ok) {
        fetchTaxSettings()
        resetTaxForm()
      }
    } catch (error) {
      console.error('Failed to save tax setting:', error)
    }
  }

  const deleteTaxSetting = async (id: string) => {
    if (confirm('Are you sure you want to delete this tax setting?')) {
      try {
        const response = await fetch(`/api/tax-settings/${id}`, { method: 'DELETE' })
        if (response.ok) fetchTaxSettings()
      } catch (error) {
        console.error('Failed to delete tax setting:', error)
      }
    }
  }

  const editTaxSetting = (tax: TaxSetting) => {
    setEditingTax(tax)
    setTaxForm({
      name: tax.name,
      description: tax.description,
      rate: tax.rate,
      type: tax.type,
      region: tax.region,
      applicableTo: tax.applicableTo,
      isActive: tax.isActive
    })
    setShowTaxForm(true)
  }

  const resetTaxForm = () => {
    setTaxForm({
      name: '',
      description: '',
      rate: 0,
      type: 'percentage',
      region: '',
      applicableTo: ['receipt', 'invoice'],
      isActive: true
    })
    setEditingTax(null)
    setShowTaxForm(false)
  }

  // Email handlers
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingEmail ? `/api/email/templates/${editingEmail._id}` : '/api/email/templates'
      const method = editingEmail ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm)
      })

      if (response.ok) {
        fetchEmailTemplates()
        resetEmailForm()
      }
    } catch (error) {
      console.error('Failed to save email template:', error)
    }
  }

  const deleteEmailTemplate = async (id: string) => {
    if (confirm('Are you sure you want to delete this email template?')) {
      try {
        const response = await fetch(`/api/email/templates/${id}`, { method: 'DELETE' })
        if (response.ok) fetchEmailTemplates()
      } catch (error) {
        console.error('Failed to delete email template:', error)
      }
    }
  }

  const editEmailTemplate = (email: EmailTemplate) => {
    setEditingEmail(email)
    setEmailForm({
      name: email.name,
      type: email.type,
      subject: email.subject,
      htmlBody: email.htmlBody,
      isActive: email.isActive
    })
    setShowEmailForm(true)
  }

  const resetEmailForm = () => {
    setEmailForm({ name: '', type: '', subject: '', htmlBody: '', isActive: true })
    setEditingEmail(null)
    setShowEmailForm(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure currencies, taxes, and email templates.
          </p>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'currencies', label: 'Currencies', icon: '💱' },
            { key: 'taxes', label: 'Tax Settings', icon: '🧮' },
            { key: 'email', label: 'Email Templates', icon: '📧' }
          ].map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === section.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Currencies Section */}
      {activeSection === 'currencies' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Currencies</h2>
            <button
              onClick={() => setShowCurrencyForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add Currency
            </button>
          </div>

          {showCurrencyForm && (
            <div className="bg-gray-50 p-4 rounded-md">
              <form onSubmit={handleCurrencySubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Code *</label>
                    <input
                      type="text"
                      required
                      value={currencyForm.code}
                      onChange={(e) => setCurrencyForm({ ...currencyForm, code: e.target.value.toUpperCase() })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      required
                      value={currencyForm.name}
                      onChange={(e) => setCurrencyForm({ ...currencyForm, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Symbol *</label>
                    <input
                      type="text"
                      required
                      value={currencyForm.symbol}
                      onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Exchange Rate *</label>
                    <input
                      type="number"
                      required
                      step="0.0001"
                      min="0"
                      value={currencyForm.exchangeRate}
                      onChange={(e) => setCurrencyForm({ ...currencyForm, exchangeRate: parseFloat(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={currencyForm.isActive}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Active</label>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {editingCurrency ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={resetCurrencyForm}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currencies.map((currency) => (
              <div key={currency._id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold">{currency.symbol} {currency.code}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      currency.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {currency.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{currency.name}</p>
                <p className="text-sm text-gray-500 mb-3">Rate: {currency.exchangeRate}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => editCurrency(currency)}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCurrency(currency._id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tax Settings Section */}
      {activeSection === 'taxes' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Tax Settings</h2>
            <button
              onClick={() => setShowTaxForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add Tax Setting
            </button>
          </div>

          {showTaxForm && (
            <div className="bg-gray-50 p-4 rounded-md">
              <form onSubmit={handleTaxSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      required
                      value={taxForm.name}
                      onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Region</label>
                    <input
                      type="text"
                      value={taxForm.region}
                      onChange={(e) => setTaxForm({ ...taxForm, region: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rate *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={taxForm.rate}
                      onChange={(e) => setTaxForm({ ...taxForm, rate: parseFloat(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={taxForm.type}
                      onChange={(e) => setTaxForm({ ...taxForm, type: e.target.value as 'percentage' | 'fixed' })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={taxForm.description}
                    onChange={(e) => setTaxForm({ ...taxForm, description: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={taxForm.isActive}
                    onChange={(e) => setTaxForm({ ...taxForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Active</label>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {editingTax ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={resetTaxForm}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {taxSettings.map((tax) => (
              <div key={tax._id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{tax.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    tax.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tax.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{tax.description}</p>
                <p className="text-sm text-gray-500 mb-1">
                  {tax.rate}{tax.type === 'percentage' ? '%' : ` (Fixed)`} • {tax.region}
                </p>
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => editTaxSetting(tax)}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTaxSetting(tax._id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Templates Section */}
      {activeSection === 'email' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Email Templates</h2>
            <button
              onClick={() => setShowEmailForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add Email Template
            </button>
          </div>

          {showEmailForm && (
            <div className="bg-gray-50 p-4 rounded-md">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      required
                      value={emailForm.name}
                      onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type *</label>
                    <select
                      required
                      value={emailForm.type}
                      onChange={(e) => setEmailForm({ ...emailForm, type: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Select type</option>
                      <option value="receipt_sent">Receipt Sent</option>
                      <option value="invoice_sent">Invoice Sent</option>
                      <option value="payment_reminder">Payment Reminder</option>
                      <option value="payment_received">Payment Received</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject *</label>
                  <input
                    type="text"
                    required
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">HTML Body *</label>
                  <textarea
                    required
                    value={emailForm.htmlBody}
                    onChange={(e) => setEmailForm({ ...emailForm, htmlBody: e.target.value })}
                    rows={8}
                    placeholder="Use {{fieldName}} for dynamic content"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={emailForm.isActive}
                    onChange={(e) => setEmailForm({ ...emailForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Active</label>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {editingEmail ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={resetEmailForm}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emailTemplates.map((template) => (
              <div key={template._id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{template.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">Type: {template.type}</p>
                <p className="text-sm text-gray-600 mb-3">Subject: {template.subject}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => editEmailTemplate(template)}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteEmailTemplate(template._id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
