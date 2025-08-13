import mongoose from 'mongoose'

export interface ITaxSetting extends mongoose.Document {
  name: string
  region: string // US, EU, UK, etc.
  taxType: 'VAT' | 'GST' | 'Sales Tax' | 'Service Tax'
  rate: number // Percentage
  description: string
  isDefault: boolean
  isActive: boolean
  applicableTo: 'services' | 'products' | 'both'
  createdAt: Date
  updatedAt: Date
}

const TaxSettingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  region: {
    type: String,
    required: true
  },
  taxType: {
    type: String,
    enum: ['VAT', 'GST', 'Sales Tax', 'Service Tax'],
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  description: {
    type: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableTo: {
    type: String,
    enum: ['services', 'products', 'both'],
    default: 'services'
  }
}, {
  timestamps: true
})

export default mongoose.models.TaxSetting || mongoose.model<ITaxSetting>('TaxSetting', TaxSettingSchema)
