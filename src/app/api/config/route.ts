import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

// Configuration Schema
const configSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now }
})

const Config = mongoose.models.Config || mongoose.model('Config', configSchema)

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

// Default freelancer configuration
const DEFAULT_FREELANCER_INFO = {
  name: 'keval chauhan',
  email: 'keval.s.chauhan1@gmail.com',
  phone: '09429806587',
  address: 'near Croma, uttarsanda road, 387001',
  website: 'https://keval.live'
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    verifyToken(request)
    
    await dbConnect()
    
    // Get freelancer config from database
    let freelancerConfig = await Config.findOne({ key: 'freelancer_info' })
    
    if (!freelancerConfig) {
      // Create default config if it doesn't exist
      freelancerConfig = new Config({
        key: 'freelancer_info',
        value: DEFAULT_FREELANCER_INFO
      })
      await freelancerConfig.save()
    }
    
    return NextResponse.json({
      freelancerInfo: freelancerConfig.value
    })
    
  } catch (error) {
    console.error('Get config error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    verifyToken(request)
    
    await dbConnect()
    
    const { freelancerInfo } = await request.json()
    
    // Update or create freelancer config
    const updatedConfig = await Config.findOneAndUpdate(
      { key: 'freelancer_info' },
      { value: freelancerInfo, updatedAt: new Date() },
      { upsert: true, new: true }
    )
    
    return NextResponse.json({
      message: 'Configuration updated successfully',
      freelancerInfo: updatedConfig.value
    })
    
  } catch (error) {
    console.error('Update config error:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    verifyToken(request)
    
    await dbConnect()
    
    // Reset to default configuration
    const defaultConfig = await Config.findOneAndUpdate(
      { key: 'freelancer_info' },
      { value: DEFAULT_FREELANCER_INFO, updatedAt: new Date() },
      { upsert: true, new: true }
    )
    
    return NextResponse.json({
      message: 'Configuration reset to default',
      freelancerInfo: defaultConfig.value
    })
    
  } catch (error) {
    console.error('Reset config error:', error)
    return NextResponse.json(
      { error: 'Failed to reset configuration' },
      { status: 500 }
    )
  }
}
