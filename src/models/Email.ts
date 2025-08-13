import mongoose from 'mongoose'

export interface IEmailTemplate extends mongoose.Document {
  name: string
  type: 'receipt_sent' | 'invoice_sent' | 'payment_reminder' | 'payment_received' | 'custom'
  subject: string
  htmlContent: string
  textContent: string
  variables: string[] // Available variables like {{clientName}}, {{amount}}, etc.
  isDefault: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const EmailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['receipt_sent', 'invoice_sent', 'payment_reminder', 'payment_received', 'custom'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  htmlContent: {
    type: String,
    required: true
  },
  textContent: {
    type: String,
    required: true
  },
  variables: [{
    type: String
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

export interface IEmailLog extends mongoose.Document {
  to: string
  subject: string
  templateType: string
  status: 'sent' | 'failed' | 'pending'
  error?: string
  sentAt?: Date
  receiptId?: string
  invoiceId?: string
  createdAt: Date
  updatedAt: Date
}

const EmailLogSchema = new mongoose.Schema({
  to: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  templateType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'pending'],
    default: 'pending'
  },
  error: {
    type: String
  },
  sentAt: {
    type: Date
  },
  receiptId: {
    type: String,
    ref: 'Receipt'
  },
  invoiceId: {
    type: String,
    ref: 'Invoice'
  }
}, {
  timestamps: true
})

export const EmailTemplate = mongoose.models.EmailTemplate || mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema)
export const EmailLog = mongoose.models.EmailLog || mongoose.model<IEmailLog>('EmailLog', EmailLogSchema)
