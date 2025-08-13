import mongoose from 'mongoose'

export interface IClient extends mongoose.Document {
  clientId: string
  name: string
  email: string
  phone: string
  address: string
  companyName?: string
  taxId?: string
  website?: string
  preferredCurrency: string
  paymentTerms: string
  notes?: string
  avatarUrl?: string
  isActive: boolean
  receipts: string[] // Receipt IDs
  invoices: string[] // Invoice IDs
  totalPaid: number
  totalPending: number
  lastContact: Date
  createdAt: Date
  updatedAt: Date
}

const ClientSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true,
    unique: true,
    default: () => 'CLI' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  companyName: {
    type: String
  },
  taxId: {
    type: String
  },
  website: {
    type: String
  },
  preferredCurrency: {
    type: String,
    default: 'USD'
  },
  paymentTerms: {
    type: String,
    default: 'Net 30'
  },
  notes: {
    type: String
  },
  avatarUrl: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  receipts: [{
    type: String,
    ref: 'Receipt'
  }],
  invoices: [{
    type: String,
    ref: 'Invoice'
  }],
  totalPaid: {
    type: Number,
    default: 0
  },
  totalPending: {
    type: Number,
    default: 0
  },
  lastContact: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

export default mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema)
