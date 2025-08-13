import mongoose from 'mongoose'

export interface IInvoice extends mongoose.Document {
  invoiceId: string
  receiptId?: string // Reference to original receipt if converted
  date: Date
  dueDate: Date
  clientInfo: {
    name: string
    email: string
    phone: string
    address: string
    taxId?: string
    companyName?: string
  }
  freelancerInfo: {
    name: string
    email: string
    phone: string
    address: string
    website?: string
    taxId?: string
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
  paymentTerms: string
  notes?: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  paymentInfo?: {
    method: string
    transactionId?: string
    paidDate?: Date
  }
  encryptedData: string
  qrCodeUrl?: string
  pdfUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const InvoiceSchema = new mongoose.Schema({
  invoiceId: {
    type: String,
    required: true,
    unique: true,
    default: () => 'INV' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
  },
  receiptId: {
    type: String,
    ref: 'Receipt'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  clientInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    taxId: { type: String },
    companyName: { type: String }
  },
  freelancerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    website: { type: String },
    taxId: { type: String },
    companyName: { type: String }
  },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  taxTotal: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  paymentTerms: {
    type: String,
    required: true,
    default: 'Net 30'
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  paymentInfo: {
    method: { type: String },
    transactionId: { type: String },
    paidDate: { type: Date }
  },
  encryptedData: {
    type: String,
    required: true
  },
  qrCodeUrl: { type: String },
  pdfUrl: { type: String },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema)
