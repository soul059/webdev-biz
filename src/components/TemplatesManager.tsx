'use client'

import { useState, useEffect } from 'react'

interface Template {
  _id: string
  name: string
  type: 'receipt' | 'invoice'
  description: string
  htmlTemplate: string
  cssStyles: string
  fields: Array<{
    name: string
    type: 'text' | 'number' | 'date' | 'email' | 'tel'
    required: boolean
    label: string
    placeholder?: string
  }>
  isDefault: boolean
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface TemplateField {
  name: string
  type: 'text' | 'number' | 'date' | 'email' | 'tel'
  required: boolean
  label: string
  placeholder?: string
}

export default function TemplatesManager() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'receipt' as 'receipt' | 'invoice',
    description: '',
    htmlTemplate: '',
    cssStyles: '',
    fields: [{ name: '', type: 'text', required: false, label: '', placeholder: '' }] as TemplateField[],
    isActive: true
  })

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingTemplate ? `/api/templates/${editingTemplate._id}` : '/api/templates'
      const method = editingTemplate ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          createdBy: 'admin'
        })
      })

      if (response.ok) {
        fetchTemplates()
        resetForm()
      }
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  // Delete template
  const handleDelete = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        const response = await fetch(`/api/templates/${templateId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          fetchTemplates()
        }
      } catch (error) {
        console.error('Failed to delete template:', error)
      }
    }
  }

  // Edit template
  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      type: template.type,
      description: template.description,
      htmlTemplate: template.htmlTemplate,
      cssStyles: template.cssStyles,
      fields: template.fields.length ? template.fields : [{ name: '', type: 'text', required: false, label: '', placeholder: '' }] as TemplateField[],
      isActive: template.isActive
    })
    setIsCreating(true)
  }

  // Add field
  const addField = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { name: '', type: 'text', required: false, label: '', placeholder: '' }]
    })
  }

  // Remove field
  const removeField = (index: number) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((_, i) => i !== index)
    })
  }

  // Update field
  const updateField = (index: number, field: string, value: any) => {
    const updatedFields = formData.fields.map((f, i) => 
      i === index ? { ...f, [field]: value } : f
    )
    setFormData({ ...formData, fields: updatedFields })
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'receipt',
      description: '',
      htmlTemplate: '',
      cssStyles: '',
      fields: [{ name: '', type: 'text', required: false, label: '', placeholder: '' }] as TemplateField[],
      isActive: true
    })
    setEditingTemplate(null)
    setIsCreating(false)
    setPreviewMode(false)
  }

  // Get template with sample data
  const getPreviewHTML = () => {
    let html = formData.htmlTemplate
    formData.fields.forEach(field => {
      const sampleValue = field.type === 'number' ? '100' : 
                         field.type === 'date' ? '2025-01-01' :
                         field.type === 'email' ? 'sample@email.com' :
                         field.type === 'tel' ? '+1-234-567-8900' :
                         `Sample ${field.label || field.name}`
      html = html.replace(new RegExp(`{{${field.name}}}`, 'g'), sampleValue)
    })
    return html
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
          <h1 className="text-2xl font-semibold text-gray-900">Templates</h1>
          <p className="mt-2 text-sm text-gray-700">
            Customize your receipt and invoice templates.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            onClick={() => setIsCreating(true)}
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Create Template
          </button>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full h-5/6 overflow-y-auto">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h3>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    {previewMode ? 'Edit' : 'Preview'}
                  </button>
                </div>
              </div>
              
              {!previewMode ? (
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type *</label>
                      <select
                        required
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'receipt' | 'invoice' })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="receipt">Receipt</option>
                        <option value="invoice">Invoice</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  {/* Fields */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Template Fields</label>
                      <button
                        type="button"
                        onClick={addField}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add Field
                      </button>
                    </div>
                    
                    {formData.fields.map((field, index) => (
                      <div key={index} className="grid grid-cols-5 gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Field name"
                          value={field.name}
                          onChange={(e) => updateField(index, 'name', e.target.value)}
                          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => updateField(index, 'type', e.target.value)}
                          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="email">Email</option>
                          <option value="tel">Phone</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Label"
                          value={field.label}
                          onChange={(e) => updateField(index, 'label', e.target.value)}
                          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, 'required', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-1 text-sm text-gray-600">Required</span>
                        </div>
                        <div className="flex items-center">
                          {formData.fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeField(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">HTML Template *</label>
                    <textarea
                      required
                      value={formData.htmlTemplate}
                      onChange={(e) => setFormData({ ...formData, htmlTemplate: e.target.value })}
                      rows={12}
                      placeholder="Use {{fieldName}} for dynamic content"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Use double curly braces like {`{{fieldName}}`} to insert dynamic content.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">CSS Styles</label>
                    <textarea
                      value={formData.cssStyles}
                      onChange={(e) => setFormData({ ...formData, cssStyles: e.target.value })}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Active</label>
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
                      {editingTemplate ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Template Preview</h4>
                  <div className="border border-gray-300 rounded-md p-4 bg-white">
                    <style dangerouslySetInnerHTML={{ __html: formData.cssStyles }} />
                    <div dangerouslySetInnerHTML={{ __html: getPreviewHTML() }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No templates found. Create your first template to get started.
          </div>
        ) : (
          templates.map((template) => (
            <div key={template._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {template.type}
                    </span>
                    {template.isDefault && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        Default
                      </span>
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                
                <div className="text-xs text-gray-500 mb-4">
                  Fields: {template.fields.length} • Created: {new Date(template.createdAt).toLocaleDateString()}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 text-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                  >
                    Edit
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={() => handleDelete(template._id)}
                      className="flex-1 text-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
