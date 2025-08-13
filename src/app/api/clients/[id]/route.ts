import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Client from '@/models/Client'
import Receipt from '@/models/Receipt'
import jwt from 'jsonwebtoken'

// Verify admin or client access
const verifyAccess = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string, clientId?: string }
    return decoded
  } catch {
    return null
  }
}

// GET /api/clients/[id] - Get specific client
export async function GET(request: NextRequest) {
  try {
    const user = verifyAccess(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    // Extract clientId from the URL
    const urlParts = request.nextUrl.pathname.split('/');
    const clientId = urlParts[urlParts.length - 1];

    const client = await Client.findOne({ clientId })
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // If client is accessing their own data, allow it
    // If admin is accessing, allow it
    const isAdmin = user.email === process.env.ADMIN_EMAIL
    const isClientOwner = user.clientId === clientId

    if (!isAdmin && !isClientOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get client's receipts and invoices
    const receipts = await Receipt.find({ 
      receiptId: { $in: client.receipts },
      isActive: true 
    }).sort({ createdAt: -1 })

    return NextResponse.json({
      client,
      receipts,
      totalReceipts: receipts.length,
      totalPaid: receipts
        .filter(r => r.paymentInfo.status === 'paid')
        .reduce((sum, r) => sum + r.paymentInfo.amount, 0),
      totalPending: receipts
        .filter(r => r.paymentInfo.status !== 'paid')
        .reduce((sum, r) => sum + r.paymentInfo.amount, 0)
    }, { status: 200 })
  } catch (error) {
    console.error('Client fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id] - Delete client (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyAccess(request)
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const clientId = params.id

    const client = await Client.findOneAndUpdate(
      { clientId },
      { isActive: false },
      { new: true }
    )

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Client deactivated' }, { status: 200 })
  } catch (error) {
    console.error('Client delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}
