import mongoose from 'mongoose'

export interface ICurrency extends mongoose.Document {
  code: string // USD, EUR, GBP, etc.
  name: string // US Dollar, Euro, etc.
  symbol: string // $, €, £, etc.
  exchangeRate: number // Rate relative to USD
  isActive: boolean
  lastUpdated: Date
  createdAt: Date
  updatedAt: Date
}

const CurrencySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    minlength: 3,
    maxlength: 3
  },
  name: {
    type: String,
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  exchangeRate: {
    type: Number,
    required: true,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

export default mongoose.models.Currency || mongoose.model<ICurrency>('Currency', CurrencySchema)
