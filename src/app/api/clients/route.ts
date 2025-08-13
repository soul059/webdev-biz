import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Client from '@/models/Client'
import Receipt from '@/models/Receipt'
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

// GET /api/clients - Get all clients (admin only)
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
    const activeOnly = searchParams.get('active') === 'true'

    const skip = (page - 1) * limit
    
    // Build search query
    const searchQuery: any = {}
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ]
    }
    if (activeOnly) {
      searchQuery.isActive = true
    }

    const [clients, totalClients] = await Promise.all([
      Client.find(searchQuery)
        .sort({ lastContact: -1 })
        .skip(skip)
        .limit(limit),
      Client.countDocuments(searchQuery)
    ])

    const totalPages = Math.ceil(totalClients / limit)

    return NextResponse.json({
      clients,
      pagination: {
        currentPage: page,
        totalPages,
        totalClients,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Clients fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

// POST /api/clients - Create new client (admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()

    // Check if client with email already exists
    const existingClient = await Client.findOne({ email: body.email })
    if (existingClient) {
      return NextResponse.json(
        { error: 'Client with this email already exists' },
        { status: 400 }
      )
    }

    const client = new Client(body)
    await client.save()

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    console.error('Client creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}

// PUT /api/clients - Update client (admin only)
export async function PUT(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()
    const { clientId, ...updateData } = body

    const client = await Client.findOneAndUpdate(
      { clientId },
      updateData,
      { new: true }
    )

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ client }, { status: 200 })
  } catch (error) {
    console.error('Client update error:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}
