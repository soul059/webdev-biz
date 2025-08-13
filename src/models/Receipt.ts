import mongoose from 'mongoose'

export interface IReceipt extends mongoose.Document {
  receiptId: string
  date: Date
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
    dueDate?: Date
  }
  encryptedData: string
  qrCodeUrl?: string
  pdfUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const ReceiptSchema = new mongoose.Schema({
  receiptId: {
    type: String,
    required: true,
    unique: true,
    default: () => 'RCP' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  clientInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }
  },
  freelancerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    website: { type: String }
  },
  projectDetails: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    technologies: [{ type: String }],
    deliverables: [{ type: String }],
    websiteUrl: { type: String },
    projectImages: [{ type: String }]
  },
  paymentInfo: {
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'USD' },
    method: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['paid', 'pending', 'partial'], 
      default: 'pending' 
    },
    dueDate: { type: Date }
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

export default mongoose.models.Receipt || mongoose.model<IReceipt>('Receipt', ReceiptSchema)
