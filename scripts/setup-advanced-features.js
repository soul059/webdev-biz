const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

// Import models (simplified versions for script)
const CurrencySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  exchangeRate: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true })

const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['receipt', 'invoice'], required: true },
  description: { type: String, required: true },
  htmlTemplate: { type: String, required: true },
  cssStyles: { type: String, default: '' },
  fields: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'date', 'email', 'tel'], required: true },
    required: { type: Boolean, default: false },
    label: { type: String, required: true },
    placeholder: { type: String }
  }],
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true }
}, { timestamps: true })

const EmailTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['receipt_sent', 'invoice_sent', 'payment_reminder', 'payment_received', 'custom'], required: true },
  subject: { type: String, required: true },
  htmlContent: { type: String, required: true },
  textContent: { type: String, required: true },
  variables: [{ type: String }],
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

const TaxSettingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  region: { type: String, required: true },
  taxType: { type: String, enum: ['VAT', 'GST', 'Sales Tax', 'Service Tax'], required: true },
  rate: { type: Number, required: true, min: 0, max: 100 },
  description: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  applicableTo: { type: String, enum: ['services', 'products', 'both'], default: 'services' }
}, { timestamps: true })

const Currency = mongoose.model('Currency', CurrencySchema)
const Template = mongoose.model('Template', TemplateSchema)
const EmailTemplate = mongoose.model('EmailTemplate', EmailTemplateSchema)
const TaxSetting = mongoose.model('TaxSetting', TaxSettingSchema)

// Default data
const defaultCurrencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1, isActive: true },
  { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.85, isActive: true },
  { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.73, isActive: true },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', exchangeRate: 1.25, isActive: true },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', exchangeRate: 1.35, isActive: true },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 87.44, isActive: true },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', exchangeRate: 110.0, isActive: true }
]

const defaultReceiptTemplate = {
  name: 'Standard Receipt Template',
  type: 'receipt',
  description: 'Default receipt template with project details and payment information',
  htmlTemplate: `
    <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #2563eb; font-size: 32px; margin-bottom: 8px;">RECEIPT</h1>
        <p style="color: #6b7280; font-size: 18px; margin: 0;">Receipt #{{receiptId}}</p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
        <div>
          <h3 style="color: #1f2937; margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">FROM:</h3>
          <p style="margin: 4px 0; color: #374151;"><strong>{{freelancerName}}</strong></p>
          <p style="margin: 4px 0; color: #6b7280;">{{freelancerEmail}}</p>
          <p style="margin: 4px 0; color: #6b7280;">{{freelancerPhone}}</p>
          <p style="margin: 4px 0; color: #6b7280;">{{freelancerAddress}}</p>
        </div>
        
        <div>
          <h3 style="color: #1f2937; margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">TO:</h3>
          <p style="margin: 4px 0; color: #374151;"><strong>{{clientName}}</strong></p>
          <p style="margin: 4px 0; color: #6b7280;">{{clientEmail}}</p>
          <p style="margin: 4px 0; color: #6b7280;">{{clientPhone}}</p>
          <p style="margin: 4px 0; color: #6b7280;">{{clientAddress}}</p>
        </div>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h3 style="color: #1f2937; margin-bottom: 16px;">PROJECT DETAILS</h3>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
          <h4 style="color: #1f2937; margin: 0 0 8px 0;">{{projectTitle}}</h4>
          <p style="color: #6b7280; margin: 0 0 16px 0;">{{projectDescription}}</p>
          <p style="color: #374151; margin: 0;"><strong>Date:</strong> {{receiptDate}}</p>
        </div>
      </div>
      
      <div style="margin-bottom: 40px;">
        <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h3 style="margin: 0 0 8px 0; font-size: 24px;">TOTAL AMOUNT</h3>
          <p style="margin: 0; font-size: 32px; font-weight: bold;">{{currency}}{{amount}}</p>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Payment Status: {{paymentStatus}}</p>
        </div>
      </div>
    </div>
  `,
  fields: [
    { name: 'receiptId', type: 'text', required: true, label: 'Receipt ID' },
    { name: 'freelancerName', type: 'text', required: true, label: 'Freelancer Name' },
    { name: 'clientName', type: 'text', required: true, label: 'Client Name' },
    { name: 'projectTitle', type: 'text', required: true, label: 'Project Title' },
    { name: 'amount', type: 'number', required: true, label: 'Amount' },
    { name: 'currency', type: 'text', required: true, label: 'Currency' }
  ],
  isDefault: true,
  createdBy: 'system'
}

const defaultInvoiceTemplate = {
  name: 'Standard Invoice Template',
  type: 'invoice',
  description: 'Default invoice template with line items and tax calculations',
  htmlTemplate: `
    <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #dc2626; font-size: 32px; margin-bottom: 8px;">INVOICE</h1>
        <p style="color: #6b7280; font-size: 18px; margin: 0;">Invoice #{{invoiceId}}</p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
        <div>
          <h3 style="color: #1f2937; margin-bottom: 16px;">FROM:</h3>
          <p style="margin: 4px 0; color: #374151;"><strong>{{freelancerName}}</strong></p>
          <p style="margin: 4px 0; color: #6b7280;">{{freelancerAddress}}</p>
        </div>
        
        <div>
          <h3 style="color: #1f2937; margin-bottom: 16px;">TO:</h3>
          <p style="margin: 4px 0; color: #374151;"><strong>{{clientName}}</strong></p>
          <p style="margin: 4px 0; color: #6b7280;">{{clientAddress}}</p>
        </div>
      </div>
      
      <div style="margin-bottom: 30px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db;">Description</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">Qty</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">Rate</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">Amount</th>
            </tr>
          </thead>
          <tbody>
            {{#each items}}
            <tr>
              <td style="padding: 12px; border: 1px solid #d1d5db;">{{description}}</td>
              <td style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">{{quantity}}</td>
              <td style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">{{currency}}{{rate}}</td>
              <td style="padding: 12px; text-align: right; border: 1px solid #d1d5db;">{{currency}}{{amount}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>
      </div>
      
      <div style="text-align: right; margin-bottom: 40px;">
        <div style="display: inline-block; min-width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span>Subtotal:</span>
            <span>{{currency}}{{subtotal}}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span>Tax:</span>
            <span>{{currency}}{{taxTotal}}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: bold; background-color: #dc2626; color: white; margin-top: 8px; padding-left: 16px; padding-right: 16px;">
            <span>Total:</span>
            <span>{{currency}}{{total}}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  fields: [
    { name: 'invoiceId', type: 'text', required: true, label: 'Invoice ID' },
    { name: 'freelancerName', type: 'text', required: true, label: 'Freelancer Name' },
    { name: 'clientName', type: 'text', required: true, label: 'Client Name' },
    { name: 'subtotal', type: 'number', required: true, label: 'Subtotal' },
    { name: 'total', type: 'number', required: true, label: 'Total' }
  ],
  isDefault: true,
  createdBy: 'system'
}

const defaultEmailTemplates = [
  {
    name: 'Receipt Sent Notification',
    type: 'receipt_sent',
    subject: 'Receipt {{receiptId}} - {{projectTitle}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Receipt Confirmation</h2>
        <p>Dear {{clientName}},</p>
        <p>Thank you for your business! Your receipt is now available.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Receipt Details:</h3>
          <p><strong>Receipt ID:</strong> {{receiptId}}</p>
          <p><strong>Project:</strong> {{projectTitle}}</p>
          <p><strong>Amount:</strong> {{currency}}{{amount}}</p>
          <p><strong>Status:</strong> {{paymentStatus}}</p>
        </div>
        
        <p><a href="{{receiptUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Receipt</a></p>
        
        <p>Best regards,<br>{{freelancerName}}</p>
      </div>
    `,
    textContent: `Receipt Confirmation

Dear {{clientName}},

Thank you for your business! Your receipt is now available.

Receipt Details:
- Receipt ID: {{receiptId}}
- Project: {{projectTitle}}
- Amount: {{currency}}{{amount}}
- Status: {{paymentStatus}}

View your receipt: {{receiptUrl}}

Best regards,
{{freelancerName}}`,
    variables: ['clientName', 'receiptId', 'projectTitle', 'amount', 'currency', 'paymentStatus', 'receiptUrl', 'freelancerName'],
    isDefault: true
  },
  {
    name: 'Invoice Sent Notification',
    type: 'invoice_sent',
    subject: 'Invoice {{invoiceId}} - Due {{dueDate}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">New Invoice</h2>
        <p>Dear {{clientName}},</p>
        <p>A new invoice has been generated for your recent project.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Invoice Details:</h3>
          <p><strong>Invoice ID:</strong> {{invoiceId}}</p>
          <p><strong>Due Date:</strong> {{dueDate}}</p>
          <p><strong>Total Amount:</strong> {{currency}}{{total}}</p>
          <p><strong>Payment Terms:</strong> {{paymentTerms}}</p>
        </div>
        
        <p><a href="{{invoiceUrl}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Invoice</a></p>
        
        <p>Please remit payment by the due date. Thank you!</p>
        
        <p>Best regards,<br>{{freelancerName}}</p>
      </div>
    `,
    textContent: `New Invoice

Dear {{clientName}},

A new invoice has been generated for your recent project.

Invoice Details:
- Invoice ID: {{invoiceId}}
- Due Date: {{dueDate}}
- Total Amount: {{currency}}{{total}}
- Payment Terms: {{paymentTerms}}

View your invoice: {{invoiceUrl}}

Please remit payment by the due date. Thank you!

Best regards,
{{freelancerName}}`,
    variables: ['clientName', 'invoiceId', 'dueDate', 'total', 'currency', 'paymentTerms', 'invoiceUrl', 'freelancerName'],
    isDefault: true
  },
  {
    name: 'Payment Reminder',
    type: 'payment_reminder',
    subject: 'Payment Reminder - Invoice {{invoiceId}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Payment Reminder</h2>
        <p>Dear {{clientName}},</p>
        <p>This is a friendly reminder that payment for the following invoice is now due:</p>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3>Overdue Invoice:</h3>
          <p><strong>Invoice ID:</strong> {{invoiceId}}</p>
          <p><strong>Original Due Date:</strong> {{dueDate}}</p>
          <p><strong>Total Amount:</strong> {{currency}}{{total}}</p>
          <p><strong>Days Overdue:</strong> {{daysOverdue}}</p>
        </div>
        
        <p>Please remit payment at your earliest convenience to avoid any late fees.</p>
        
        <p><a href="{{invoiceUrl}}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Invoice</a></p>
        
        <p>If you have any questions or concerns, please don't hesitate to contact me.</p>
        
        <p>Best regards,<br>{{freelancerName}}</p>
      </div>
    `,
    textContent: `Payment Reminder

Dear {{clientName}},

This is a friendly reminder that payment for the following invoice is now due:

Overdue Invoice:
- Invoice ID: {{invoiceId}}
- Original Due Date: {{dueDate}}
- Total Amount: {{currency}}{{total}}
- Days Overdue: {{daysOverdue}}

Please remit payment at your earliest convenience to avoid any late fees.

View your invoice: {{invoiceUrl}}

If you have any questions or concerns, please don't hesitate to contact me.

Best regards,
{{freelancerName}}`,
    variables: ['clientName', 'invoiceId', 'dueDate', 'total', 'currency', 'daysOverdue', 'invoiceUrl', 'freelancerName'],
    isDefault: false
  }
]

const defaultTaxSettings = [
  {
    name: 'US Sales Tax (General)',
    region: 'US',
    taxType: 'Sales Tax',
    rate: 8.25,
    description: 'General US sales tax rate - adjust based on your state/local requirements',
    isDefault: false,
    applicableTo: 'both'
  },
  {
    name: 'EU VAT (Standard)',
    region: 'EU',
    taxType: 'VAT',
    rate: 20,
    description: 'Standard EU VAT rate - adjust based on your country',
    isDefault: false,
    applicableTo: 'both'
  },
  {
    name: 'UK VAT (Standard)',
    region: 'UK',
    taxType: 'VAT',
    rate: 20,
    description: 'UK standard VAT rate',
    isDefault: false,
    applicableTo: 'both'
  },
  {
    name: 'Canada GST',
    region: 'CA',
    taxType: 'GST',
    rate: 5,
    description: 'Canada Goods and Services Tax',
    isDefault: false,
    applicableTo: 'both'
  },
  {
    name: 'Australia GST',
    region: 'AU',
    taxType: 'GST',
    rate: 10,
    description: 'Australia Goods and Services Tax',
    isDefault: false,
    applicableTo: 'both'
  },
  {
    name: 'No Tax',
    region: 'Global',
    taxType: 'Sales Tax',
    rate: 0,
    description: 'No tax applied',
    isDefault: true,
    applicableTo: 'both'
  }
]

async function setupAdvancedFeatures() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Setup currencies
    console.log('Setting up currencies...')
    for (const currencyData of defaultCurrencies) {
      const existing = await Currency.findOne({ code: currencyData.code })
      if (!existing) {
        await Currency.create(currencyData)
        console.log(`Created currency: ${currencyData.code}`)
      } else {
        console.log(`Currency ${currencyData.code} already exists`)
      }
    }

    // Setup templates
    console.log('Setting up templates...')
    
    try {
      // Receipt template
      const existingReceiptTemplate = await Template.findOne({ type: 'receipt', isDefault: true })
      if (!existingReceiptTemplate) {
        await Template.create(defaultReceiptTemplate)
        console.log('Created default receipt template')
      } else {
        console.log('Default receipt template already exists')
      }

      // Invoice template
      const existingInvoiceTemplate = await Template.findOne({ type: 'invoice', isDefault: true })
      if (!existingInvoiceTemplate) {
        await Template.create(defaultInvoiceTemplate)
        console.log('Created default invoice template')
      } else {
        console.log('Default invoice template already exists')
      }
    } catch (error) {
      console.error('Error creating templates:', error.message)
      console.log('Skipping templates for now...')
    }

    // Setup email templates
    console.log('Setting up email templates...')
    for (const emailTemplate of defaultEmailTemplates) {
      const existing = await EmailTemplate.findOne({ type: emailTemplate.type, name: emailTemplate.name })
      if (!existing) {
        await EmailTemplate.create(emailTemplate)
        console.log(`Created email template: ${emailTemplate.name}`)
      } else {
        console.log(`Email template ${emailTemplate.name} already exists`)
      }
    }

    // Setup tax settings
    console.log('Setting up tax settings...')
    for (const taxSetting of defaultTaxSettings) {
      const existing = await TaxSetting.findOne({ name: taxSetting.name, region: taxSetting.region })
      if (!existing) {
        await TaxSetting.create(taxSetting)
        console.log(`Created tax setting: ${taxSetting.name}`)
      } else {
        console.log(`Tax setting ${taxSetting.name} already exists`)
      }
    }

    console.log('\n✅ Advanced features setup completed successfully!')
    console.log('\nFeatures initialized:')
    console.log('• Multi-currency support with 7 major currencies')
    console.log('• Default receipt and invoice templates')
    console.log('• Email notification templates')
    console.log('• Tax calculation settings for major regions')
    console.log('\nYou can now use the admin dashboard to:')
    console.log('• Manage clients and create invoices')
    console.log('• Customize templates for receipts and invoices')
    console.log('• Set up email notifications')
    console.log('• Configure tax settings for your region')
    console.log('• Export data to accounting software')

  } catch (error) {
    console.error('Setup failed:', error)
  } finally {
    mongoose.connection.close()
  }
}

// Run the setup
if (require.main === module) {
  setupAdvancedFeatures()
}

module.exports = setupAdvancedFeatures
