import nodemailer from 'nodemailer'

export interface EmailConfig {
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

// Create transporter based on environment
const createTransporter = () => {
  // For development/testing - use ethereal email or configure your SMTP
  if (process.env.NODE_ENV === 'development') {
    // You can use Ethereal Email for testing: https://ethereal.email/
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
        pass: process.env.SMTP_PASS || 'ethereal.pass'
      }
    })
  }

  // For production - configure your actual SMTP service
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!
    }
  })
}

// Send email function
export const sendEmail = async (config: EmailConfig) => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: config.to,
      subject: config.subject,
      html: config.html,
      text: config.text,
      attachments: config.attachments
    }

    const info = await transporter.sendMail(mailOptions)
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: config.to,
      subject: config.subject
    })

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info) // Only works with Ethereal Email
    }
  } catch (error: any) {
    console.error('Email sending failed:', error)
    throw new Error(`Email sending failed: ${error.message}`)
  }
}

// Generate email template with variables
export const generateEmailFromTemplate = (template: string, variables: Record<string, string>) => {
  let result = template
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
  })
  return result
}

// Common email templates
export const getDefaultEmailTemplates = () => ({
  receiptSent: {
    subject: 'Receipt #{{receiptId}} - {{freelancerName}}',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #2563eb;">Receipt Confirmation</h2>
        <p>Dear {{clientName}},</p>
        <p>Thank you for your payment! Please find your receipt details below:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Receipt #{{receiptId}}</h3>
          <p><strong>Project:</strong> {{projectTitle}}</p>
          <p><strong>Amount:</strong> {{currency}} {{amount}}</p>
          <p><strong>Date:</strong> {{date}}</p>
          <p><strong>Status:</strong> {{paymentStatus}}</p>
        </div>
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>{{freelancerName}}</p>
      </div>
    `,
    text: `
Receipt Confirmation

Dear {{clientName}},

Thank you for your payment! Please find your receipt details below:

Receipt #{{receiptId}}
Project: {{projectTitle}}
Amount: {{currency}} {{amount}}
Date: {{date}}
Status: {{paymentStatus}}

If you have any questions, please don't hesitate to contact us.

Best regards,
{{freelancerName}}
    `
  },
  invoiceSent: {
    subject: 'Invoice #{{invoiceId}} - {{freelancerName}}',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #dc2626;">Invoice</h2>
        <p>Dear {{clientName}},</p>
        <p>Please find your invoice attached below:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Invoice #{{invoiceId}}</h3>
          <p><strong>Total Amount:</strong> {{currency}} {{total}}</p>
          <p><strong>Due Date:</strong> {{dueDate}}</p>
          <p><strong>Payment Terms:</strong> {{paymentTerms}}</p>
        </div>
        
        <p>You can view your invoice online at: <a href="{{invoiceUrl}}">View Invoice</a></p>
        <p>Please ensure payment is made by the due date.</p>
        
        <p>Best regards,<br>{{freelancerName}}</p>
      </div>
    `,
    text: `
Invoice

Dear {{clientName}},

Please find your invoice details below:

Invoice #{{invoiceId}}
Total Amount: {{currency}} {{total}}
Due Date: {{dueDate}}
Payment Terms: {{paymentTerms}}

You can view your invoice online at: {{invoiceUrl}}

Please ensure payment is made by the due date.

Best regards,
{{freelancerName}}
    `
  }
})
