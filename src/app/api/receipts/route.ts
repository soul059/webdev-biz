import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import QRCode from 'qrcode'
import dbConnect from '@/lib/mongodb'
import Receipt from '@/models/Receipt'
import { encrypt, decrypt } from '@/lib/encryption'
import { sendEmail, generateEmailFromTemplate } from '@/lib/email'
import { EmailTemplate } from '@/models/Email'
import { v2 as cloudinary } from 'cloudinary'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function verifyToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw new Error('No token provided')
  }
  
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    verifyToken(request)
    
    await dbConnect()
    
    const receiptData = await request.json()
    
    // Encrypt sensitive data
    const sensitiveData = {
      clientInfo: receiptData.clientInfo,
      freelancerInfo: receiptData.freelancerInfo,
      paymentInfo: receiptData.paymentInfo,
      projectDetails: receiptData.projectDetails
    }
    
    const encryptedData = encrypt(JSON.stringify(sensitiveData))
    
    // Create receipt
    const receipt = new Receipt({
      ...receiptData,
      encryptedData
    })
    
    await receipt.save()
    
    // Generate QR Code
    const qrCodeUrl = `${process.env.NEXTAUTH_URL}/receipt/${receipt.receiptId}`
    const qrCodeData = await QRCode.toDataURL(qrCodeUrl)
    
    // Upload QR code to Cloudinary (with fallback)
    let qrCodeImageUrl = null
    try {
      const qrUpload = await cloudinary.uploader.upload(qrCodeData, {
        folder: 'receipt-qr-codes',
        public_id: `qr-${receipt.receiptId}`,
      })
      qrCodeImageUrl = qrUpload.secure_url
    } catch (cloudinaryError) {
      console.warn('Cloudinary upload failed, using QR data directly:', cloudinaryError)
      // Store the data URL as fallback
      qrCodeImageUrl = qrCodeData
    }
    
    // Update receipt with QR code URL
    receipt.qrCodeUrl = qrCodeImageUrl
    await receipt.save()
    
    // Send email notification to client (optional)
    try {
      if (receiptData.clientInfo?.email && receiptData.sendEmail !== false) {
        // Get receipt email template
        const emailTemplate = await EmailTemplate.findOne({ 
          type: 'receipt_sent', 
          isActive: true 
        }).sort({ isDefault: -1 })
        
        if (emailTemplate) {
          const emailVariables = {
            clientName: receiptData.clientInfo.name,
            freelancerName: receiptData.freelancerInfo.name,
            receiptId: receipt.receiptId,
            projectTitle: receiptData.projectDetails.title,
            amount: receiptData.paymentInfo.amount.toString(),
            currency: receiptData.paymentInfo.currency,
            date: new Date(receipt.date).toLocaleDateString(),
            paymentStatus: receiptData.paymentInfo.status,
            receiptUrl: `${process.env.NEXTAUTH_URL}/receipt/${receipt.receiptId}`
          }
          
          await sendEmail({
            to: receiptData.clientInfo.email,
            subject: generateEmailFromTemplate(emailTemplate.subject, emailVariables),
            html: generateEmailFromTemplate(emailTemplate.htmlContent, emailVariables)
          })
        }
      }
    } catch (emailError) {
      console.error('Failed to send receipt email:', emailError)
      // Don't fail the receipt creation if email fails
    }
    
    return NextResponse.json({
      message: 'Receipt created successfully',
      receipt: {
        id: receipt._id,
        receiptId: receipt.receiptId,
        qrCodeUrl: receipt.qrCodeUrl,
        date: receipt.date
      }
    })
    
  } catch (error) {
    console.error('Create receipt error:', error)
    return NextResponse.json(
      { error: 'Failed to create receipt' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    verifyToken(request)
    
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const skip = (page - 1) * limit
    
    // Build query
    let query: any = { isActive: true }
    
    // Status filter
    if (status && status !== 'all') {
      query['paymentInfo.status'] = status
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { receiptId: { $regex: search, $options: 'i' } },
        { 'clientInfo.name': { $regex: search, $options: 'i' } },
        { 'clientInfo.email': { $regex: search, $options: 'i' } },
        { 'projectDetails.title': { $regex: search, $options: 'i' } },
        { 'projectDetails.description': { $regex: search, $options: 'i' } }
      ]
    }
    
    const receipts = await Receipt.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
    
    const total = await Receipt.countDocuments(query)
    
    // Decrypt the data for admin view
    const decryptedReceipts = receipts.map(receipt => {
      try {
        const decryptedData = JSON.parse(decrypt(receipt.encryptedData))
        
        // Ensure freelancerInfo exists with defaults
        if (!decryptedData.freelancerInfo) {
          decryptedData.freelancerInfo = {
            name: 'keval chauhan',
            email: 'keval.s.chauhan1@gmail.com',
            phone: '09429806587',
            address: 'near Croma, uttarsanda road, 387001',
            website: ''
          }
        }
        
        return {
          _id: receipt._id,
          receiptId: receipt.receiptId,
          date: receipt.date,
          qrCodeUrl: receipt.qrCodeUrl,
          pdfUrl: receipt.pdfUrl,
          createdAt: receipt.createdAt,
          updatedAt: receipt.updatedAt,
          ...decryptedData
        }
      } catch (error) {
        console.error('Error decrypting receipt data:', error)
        return receipt
      }
    })
    
    return NextResponse.json({
      receipts: decryptedReceipts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Get receipts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 }
    )
  }
}
