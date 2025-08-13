import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Invoice from '@/models/Invoice'
import { encrypt } from '@/lib/encryption'
import { sendEmail, generateEmailFromTemplate } from '@/lib/email'
import { EmailTemplate } from '@/models/Email'
import QRCode from 'qrcode'
import jwt from 'jsonwebtoken'

// Verify admin authentication
const verifyAdmin = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string }
    return decoded
  } catch {
    return null
  }
}

// GET /api/invoices - Get all invoices (admin only)
export async function GET(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    const skip = (page - 1) * limit
    
    // Build search query
    const searchQuery: any = { isActive: true }
    if (search) {
      searchQuery.$or = [
        { invoiceId: { $regex: search, $options: 'i' } },
        { 'clientInfo.name': { $regex: search, $options: 'i' } },
        { 'clientInfo.email': { $regex: search, $options: 'i' } }
      ]
    }
    if (status !== 'all') {
      searchQuery.status = status
    }

    const [invoices, totalInvoices] = await Promise.all([
      Invoice.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(searchQuery)
    ])

    const totalPages = Math.ceil(totalInvoices / limit)

    return NextResponse.json({
      invoices,
      pagination: {
        currentPage: page,
        totalPages,
        totalInvoices,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Invoices fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Create new invoice (admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()

    // Calculate totals
    let subtotal = 0
    let taxTotal = 0
    
    const items = body.items.map((item: any) => {
      const amount = item.quantity * item.rate
      const taxAmount = (amount * (item.taxRate || 0)) / 100
      subtotal += amount
      taxTotal += taxAmount
      
      return {
        ...item,
        amount,
        taxAmount
      }
    })

    const total = subtotal + taxTotal

    // Create invoice data
    const invoiceData = {
      ...body,
      items,
      subtotal,
      taxTotal,
      total
    }

    // Encrypt sensitive data
    const encryptedData = encrypt(JSON.stringify({
      clientInfo: invoiceData.clientInfo,
      freelancerInfo: invoiceData.freelancerInfo,
      items: invoiceData.items,
      paymentInfo: invoiceData.paymentInfo
    }))

    // Generate QR Code
    const qrCodeUrl = await QRCode.toDataURL(
      `${process.env.NEXTAUTH_URL}/invoice/${invoiceData.invoiceId || 'temp'}`,
      { width: 200, margin: 2 }
    )

    const invoice = new Invoice({
      ...invoiceData,
      encryptedData,
      qrCodeUrl
    })

    await invoice.save()

    // Send email notification to client (optional)
    try {
      if (invoiceData.clientInfo?.email && invoiceData.sendEmail !== false) {
        // Get invoice email template
        const emailTemplate = await EmailTemplate.findOne({ 
          type: 'invoice_sent', 
          isActive: true 
        }).sort({ isDefault: -1 })
        
        if (emailTemplate) {
          const emailVariables = {
            clientName: invoiceData.clientInfo.name,
            freelancerName: invoiceData.freelancerInfo?.name || 'Freelancer',
            invoiceId: invoice.invoiceId,
            total: invoiceData.total.toString(),
            currency: invoiceData.currency,
            dueDate: new Date(invoiceData.dueDate).toLocaleDateString(),
            paymentTerms: invoiceData.paymentTerms || 'Net 30',
            invoiceUrl: `${process.env.NEXTAUTH_URL}/invoice/${invoice._id}`
          }
          
          await sendEmail({
            to: invoiceData.clientInfo.email,
            subject: generateEmailFromTemplate(emailTemplate.subject, emailVariables),
            html: generateEmailFromTemplate(emailTemplate.htmlContent, emailVariables)
          })
        }
      }
    } catch (emailError) {
      console.error('Failed to send invoice email:', emailError)
      // Don't fail the invoice creation if email fails
    }

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    console.error('Invoice creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}

// PUT /api/invoices - Update invoice (admin only)
export async function PUT(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()
    const { invoiceId, ...updateData } = body

    // Recalculate totals if items are updated
    if (updateData.items) {
      let subtotal = 0
      let taxTotal = 0
      
      updateData.items = updateData.items.map((item: any) => {
        const amount = item.quantity * item.rate
        const taxAmount = (amount * (item.taxRate || 0)) / 100
        subtotal += amount
        taxTotal += taxAmount
        
        return {
          ...item,
          amount,
          taxAmount
        }
      })

      updateData.subtotal = subtotal
      updateData.taxTotal = taxTotal
      updateData.total = subtotal + taxTotal
    }

    // Update encrypted data if sensitive info changed
    if (updateData.clientInfo || updateData.freelancerInfo || updateData.items || updateData.paymentInfo) {
      const currentInvoice = await Invoice.findOne({ invoiceId })
      if (currentInvoice) {
        const encryptedData = encrypt(JSON.stringify({
          clientInfo: updateData.clientInfo || currentInvoice.clientInfo,
          freelancerInfo: updateData.freelancerInfo || currentInvoice.freelancerInfo,
          items: updateData.items || currentInvoice.items,
          paymentInfo: updateData.paymentInfo || currentInvoice.paymentInfo
        }))
        updateData.encryptedData = encryptedData
      }
    }

    const invoice = await Invoice.findOneAndUpdate(
      { invoiceId },
      updateData,
      { new: true }
    )

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ invoice }, { status: 200 })
  } catch (error) {
    console.error('Invoice update error:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}
