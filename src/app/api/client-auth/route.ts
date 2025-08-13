import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Client from '@/models/Client'
import jwt from 'jsonwebtoken'

// POST /api/client-auth - Client portal authentication
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { clientId, accessCode } = await request.json()

    if (!clientId || !accessCode) {
      return NextResponse.json(
        { error: 'Client ID and access code are required' },
        { status: 400 }
      )
    }

    // Find client
    const client = await Client.findOne({ clientId, isActive: true })
    if (!client) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // For now, we'll use email as access code (you can implement a proper access code system)
    // In production, you should hash and store access codes securely
    const emailAccessCode = client.email.toLowerCase()
    if (accessCode.toLowerCase() !== emailAccessCode) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token for client
    const token = jwt.sign(
      { 
        clientId: client.clientId,
        email: client.email,
        type: 'client'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Update last contact
    client.lastContact = new Date()
    await client.save()

    return NextResponse.json({
      token,
      client: {
        clientId: client.clientId,
        name: client.name,
        email: client.email
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Client auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
