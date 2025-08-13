import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import Receipt from '@/models/Receipt'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

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

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    verifyToken(request)
    
    await dbConnect()
    
    // Get analytics data
    const totalReceipts = await Receipt.countDocuments({ isActive: true })
    
    const paidReceipts = await Receipt.countDocuments({ 
      isActive: true,
      'paymentInfo.status': 'paid'
    })
    
    const pendingReceipts = await Receipt.countDocuments({ 
      isActive: true,
      'paymentInfo.status': 'pending'
    })
    
    const partialReceipts = await Receipt.countDocuments({ 
      isActive: true,
      'paymentInfo.status': 'partial'
    })
    
    // Calculate total revenue (only from paid receipts) grouped by currency
    const revenueData = await Receipt.aggregate([
      {
        $match: {
          isActive: true,
          'paymentInfo.status': 'paid'
        }
      },
      {
        $group: {
          _id: '$paymentInfo.currency',
          totalRevenue: { $sum: '$paymentInfo.amount' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ])

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0
    const primaryCurrency = revenueData.length > 0 ? revenueData[0]._id : 'USD'
    
    // Monthly revenue chart data
    const monthlyRevenue = await Receipt.aggregate([
      {
        $match: {
          isActive: true,
          'paymentInfo.status': 'paid',
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$paymentInfo.amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ])
    
    // Recent receipts
    const recentReceipts = await Receipt.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('receiptId date paymentInfo.amount paymentInfo.status paymentInfo.currency clientInfo.name')
    
    return NextResponse.json({
      summary: {
        totalReceipts,
        paidReceipts,
        pendingReceipts,
        partialReceipts,
        totalRevenue,
        primaryCurrency,
        revenueByCurrency: revenueData
      },
      monthlyRevenue,
      recentReceipts
    })
    
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
