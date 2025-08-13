import mongoose from 'mongoose'

export interface ITemplate extends mongoose.Document {
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
  createdAt: Date
  updatedAt: Date
}

const TemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['receipt', 'invoice'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  htmlTemplate: {
    type: String,
    required: true
  },
  cssStyles: {
    type: String,
    default: ''
  },
  fields: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'date', 'email', 'tel'], required: true },
    required: { type: Boolean, default: false },
    label: { type: String, required: true },
    placeholder: { type: String }
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
})

export default mongoose.models.Template || mongoose.model<ITemplate>('Template', TemplateSchema)
