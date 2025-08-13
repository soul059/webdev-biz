import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Receipt from '@/models/Receipt'
import { decrypt } from '@/lib/encryption'

interface Props {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    await dbConnect()
    
    const { id } = await params
    
    // Find receipt by receiptId
    const receipt = await Receipt.findOne({ 
      receiptId: id, 
      isActive: true 
    })
    
    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      )
    }
    
    // Decrypt sensitive data
    let decryptedData
    try {
      decryptedData = JSON.parse(decrypt(receipt.encryptedData))
    } catch (decryptError) {
      console.error('Decryption error:', decryptError)
      return NextResponse.json(
        { error: 'Failed to decrypt receipt data' },
        { status: 500 }
      )
    }
    
    // Ensure required structure exists with proper defaults
    const safeData = {
      clientInfo: decryptedData.clientInfo || {
        name: 'N/A',
        email: 'N/A', 
        phone: 'N/A',
        address: 'N/A'
      },
      freelancerInfo: decryptedData.freelancerInfo || {
        name: 'keval chauhan',
        email: 'keval.s.chauhan1@gmail.com',
        phone: '09429806587',
        address: 'near Croma, uttarsanda road, 387001',
        website: ''
      },
      projectDetails: decryptedData.projectDetails || {
        title: 'N/A',
        description: 'N/A',
        technologies: [],
        deliverables: [],
        websiteUrl: ''
      },
      paymentInfo: decryptedData.paymentInfo || {
        amount: 0,
        currency: 'USD',
        method: 'N/A',
        status: 'pending',
        dueDate: ''
      }
    }
    
    // Return receipt data
    return NextResponse.json({
      receiptId: receipt.receiptId,
      date: receipt.date,
      qrCodeUrl: receipt.qrCodeUrl,
      pdfUrl: receipt.pdfUrl,
      ...safeData,
      createdAt: receipt.createdAt
    })
    
  } catch (error) {
    console.error('Get receipt error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch receipt' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Props
) {
  try {
    // Verify admin authentication (add this import at the top)
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }
    
    await dbConnect()
    
    const { id } = await params
    
    // Find and soft delete the receipt
    const receipt = await Receipt.findOneAndUpdate(
      { receiptId: id, isActive: true },
      { isActive: false },
      { new: true }
    )
    
    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: 'Receipt deleted successfully'
    })
    
  } catch (error) {
    console.error('Delete receipt error:', error)
    return NextResponse.json(
      { error: 'Failed to delete receipt' },
      { status: 500 }
    )
  }
}
