import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Currency from '@/models/Currency'
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

// GET /api/currencies - Get all currencies
export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const filter = activeOnly ? { isActive: true } : {}
    const currencies = await Currency.find(filter).sort({ code: 1 })

    return NextResponse.json({ currencies }, { status: 200 })
  } catch (error) {
    console.error('Currency fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch currencies' },
      { status: 500 }
    )
  }
}

// POST /api/currencies - Create new currency (admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()
    const { code, name, symbol, exchangeRate } = body

    // Check if currency already exists
    const existingCurrency = await Currency.findOne({ code: code.toUpperCase() })
    if (existingCurrency) {
      return NextResponse.json(
        { error: 'Currency with this code already exists' },
        { status: 400 }
      )
    }

    const currency = new Currency({
      code: code.toUpperCase(),
      name,
      symbol,
      exchangeRate: exchangeRate || 1,
      lastUpdated: new Date()
    })

    await currency.save()

    return NextResponse.json({ currency }, { status: 201 })
  } catch (error) {
    console.error('Currency creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create currency' },
      { status: 500 }
    )
  }
}

// PUT /api/currencies - Update exchange rates (admin only)
export async function PUT(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()
    const { currencies } = body // Array of {code, exchangeRate}

    const updatePromises = currencies.map(async ({ code, exchangeRate }: any) => {
      return Currency.findOneAndUpdate(
        { code: code.toUpperCase() },
        { exchangeRate, lastUpdated: new Date() },
        { new: true }
      )
    })

    const updatedCurrencies = await Promise.all(updatePromises)

    return NextResponse.json({ currencies: updatedCurrencies }, { status: 200 })
  } catch (error) {
    console.error('Currency update error:', error)
    return NextResponse.json(
      { error: 'Failed to update currencies' },
      { status: 500 }
    )
  }
}
