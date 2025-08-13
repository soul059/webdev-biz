'use client'

import { useState, useEffect } from 'react'

interface ReceiptFormData {
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
    website: string
  }
  projectDetails: {
    title: string
    description: string
    technologies: string[]
    deliverables: string[]
    websiteUrl: string
    projectImages: string[]
  }
  paymentInfo: {
    amount: number
    currency: string
    method: string
    status: 'paid' | 'pending' | 'partial'
    dueDate: string
  }
  sendEmail?: boolean
}

interface ReceiptFormProps {
  onSubmit: (data: ReceiptFormData) => Promise<void>
  loading: boolean
}

export default function ReceiptForm({ onSubmit, loading }: ReceiptFormProps) {
  const [sendEmail, setSendEmail] = useState(true)
  const [formData, setFormData] = useState<ReceiptFormData>({
    clientInfo: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    freelancerInfo: {
      name: '',
      email: '',
      phone: '',
      address: '',
      website: ''
    },
    projectDetails: {
      title: '',
      description: '',
      technologies: [],
      deliverables: [],
      websiteUrl: '',
      projectImages: []
    },
    paymentInfo: {
      amount: 0,
      currency: 'USD',
      method: '',
      status: 'pending',
      dueDate: ''
    }
  })

  const [techInput, setTechInput] = useState('')
  const [deliverableInput, setDeliverableInput] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [configLoading, setConfigLoading] = useState(true)

  // Load freelancer configuration on component mount
  useEffect(() => {
    const loadFreelancerConfig = async () => {
      try {
        const token = localStorage.getItem('adminToken')
        if (!token) return

        const response = await fetch('/api/config', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setFormData(prev => ({
            ...prev,
            freelancerInfo: data.freelancerInfo
          }))
        }
      } catch (error) {
        console.error('Failed to load freelancer config:', error)
      } finally {
        setConfigLoading(false)
      }
    }

    loadFreelancerConfig()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({ ...formData, sendEmail })
  }

  const handleChange = (
    section: 'clientInfo' | 'freelancerInfo' | 'projectDetails' | 'paymentInfo',
    field: string,
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const addTechnology = () => {
    if (techInput.trim()) {
      setFormData(prev => ({
        ...prev,
        projectDetails: {
          ...prev.projectDetails,
          technologies: [...prev.projectDetails.technologies, techInput.trim()]
        }
      }))
      setTechInput('')
    }
  }

  const removeTechnology = (index: number) => {
    setFormData(prev => ({
      ...prev,
      projectDetails: {
        ...prev.projectDetails,
        technologies: prev.projectDetails.technologies.filter((_, i) => i !== index)
      }
    }))
  }

  const addDeliverable = () => {
    if (deliverableInput.trim()) {
      setFormData(prev => ({
        ...prev,
        projectDetails: {
          ...prev.projectDetails,
          deliverables: [...prev.projectDetails.deliverables, deliverableInput.trim()]
        }
      }))
      setDeliverableInput('')
    }
  }

  const removeDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      projectDetails: {
        ...prev.projectDetails,
        deliverables: prev.projectDetails.deliverables.filter((_, i) => i !== index)
      }
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setImageUploading(true)
    try {
      const uploadedUrls: string[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Convert file to base64 for simple storage
        const reader = new FileReader()
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        
        const base64Url = await base64Promise
        uploadedUrls.push(base64Url)
      }
      
      setFormData(prev => ({
        ...prev,
        projectDetails: {
          ...prev.projectDetails,
          projectImages: [...prev.projectDetails.projectImages, ...uploadedUrls]
        }
      }))
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Failed to upload images. Please try again.')
    } finally {
      setImageUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      projectDetails: {
        ...prev.projectDetails,
        projectImages: prev.projectDetails.projectImages.filter((_, i) => i !== index)
      }
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Client Information */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name *
            </label>
            <input
              type="text"
              required
              value={formData.clientInfo.name}
              onChange={(e) => handleChange('clientInfo', 'name', e.target.value)}
              className="w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.clientInfo.email}
              onChange={(e) => handleChange('clientInfo', 'email', e.target.value)}
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
              value={formData.clientInfo.phone}
              onChange={(e) => handleChange('clientInfo', 'phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <textarea
              required
              value={formData.clientInfo.address}
              onChange={(e) => handleChange('clientInfo', 'address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Freelancer Information */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name *
            </label>
            <input
              type="text"
              required
              value={formData.freelancerInfo.name}
              onChange={(e) => handleChange('freelancerInfo', 'name', e.target.value)}
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
              value={formData.freelancerInfo.email}
              onChange={(e) => handleChange('freelancerInfo', 'email', e.target.value)}
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
              value={formData.freelancerInfo.phone}
              onChange={(e) => handleChange('freelancerInfo', 'phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              value={formData.freelancerInfo.website}
              onChange={(e) => handleChange('freelancerInfo', 'website', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <textarea
              required
              value={formData.freelancerInfo.address}
              onChange={(e) => handleChange('freelancerInfo', 'address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Project Details */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={formData.projectDetails.title}
              onChange={(e) => handleChange('projectDetails', 'title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Description *
            </label>
            <textarea
              required
              value={formData.projectDetails.description}
              onChange={(e) => handleChange('projectDetails', 'description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <input
              type="url"
              value={formData.projectDetails.websiteUrl}
              onChange={(e) => handleChange('projectDetails', 'websiteUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
            />
          </div>
          
          {/* Technologies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technologies Used
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                placeholder="Enter technology and press Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addTechnology}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.projectDetails.technologies.map((tech, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeTechnology(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          {/* Deliverables */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deliverables
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={deliverableInput}
                onChange={(e) => setDeliverableInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
                placeholder="Enter deliverable and press Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addDeliverable}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {formData.projectDetails.deliverables.map((deliverable, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md"
                >
                  <span className="text-green-800">{deliverable}</span>
                  <button
                    type="button"
                    onClick={() => removeDeliverable(index)}
                    className="text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Project Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Images
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              disabled={imageUploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
            />
            {imageUploading && (
              <p className="text-sm text-blue-600 mt-1">Uploading images...</p>
            )}
            
            {formData.projectDetails.projectImages.length > 0 && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                {formData.projectDetails.projectImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Project image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.paymentInfo.amount}
              onChange={(e) => handleChange('paymentInfo', 'amount', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency *
            </label>
            <select
              required
              value={formData.paymentInfo.currency}
              onChange={(e) => handleChange('paymentInfo', 'currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="INR">INR</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method *
            </label>
            <input
              type="text"
              required
              value={formData.paymentInfo.method}
              onChange={(e) => handleChange('paymentInfo', 'method', e.target.value)}
              placeholder="e.g., Bank Transfer, PayPal, Stripe"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status *
            </label>
            <select
              required
              value={formData.paymentInfo.status}
              onChange={(e) => handleChange('paymentInfo', 'status', e.target.value as 'paid' | 'pending' | 'partial')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial Payment</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.paymentInfo.dueDate}
              onChange={(e) => handleChange('paymentInfo', 'dueDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Email Notification Option */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="sendEmail"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="sendEmail" className="ml-2 block text-sm text-gray-900">
            Send email notification to client
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {formData.clientInfo.email 
            ? `Email will be sent to ${formData.clientInfo.email}`
            : 'Client email is required for email notifications'
          }
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Receipt...' : 'Create Receipt'}
        </button>
      </div>
    </form>
  )
}
