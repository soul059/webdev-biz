import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import TaxSetting from '@/models/TaxSetting'
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

// GET /api/tax-settings - Get all tax settings
export async function GET(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region')
    const activeOnly = searchParams.get('active') === 'true'

    const filter: any = {}
    if (region) filter.region = region
    if (activeOnly) filter.isActive = true

    const taxSettings = await TaxSetting.find(filter).sort({ region: 1, isDefault: -1, name: 1 })

    return NextResponse.json({ taxSettings }, { status: 200 })
  } catch (error) {
    console.error('Tax settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tax settings' },
      { status: 500 }
    )
  }
}

// POST /api/tax-settings - Create new tax setting (admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()

    const taxSetting = new TaxSetting(body)

    // If this is set as default, unset other defaults in the same region
    if (taxSetting.isDefault) {
      await TaxSetting.updateMany(
        { region: taxSetting.region, isDefault: true },
        { isDefault: false }
      )
    }

    await taxSetting.save()

    return NextResponse.json({ taxSetting }, { status: 201 })
  } catch (error) {
    console.error('Tax setting creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create tax setting' },
      { status: 500 }
    )
  }
}

// PUT /api/tax-settings - Update tax setting (admin only)
export async function PUT(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()
    const { taxSettingId, ...updateData } = body

    // If setting as default, unset other defaults in the same region
    if (updateData.isDefault) {
      const taxSetting = await TaxSetting.findById(taxSettingId)
      if (taxSetting) {
        await TaxSetting.updateMany(
          { region: taxSetting.region, isDefault: true, _id: { $ne: taxSettingId } },
          { isDefault: false }
        )
      }
    }

    const taxSetting = await TaxSetting.findByIdAndUpdate(
      taxSettingId,
      updateData,
      { new: true }
    )

    if (!taxSetting) {
      return NextResponse.json(
        { error: 'Tax setting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ taxSetting }, { status: 200 })
  } catch (error) {
    console.error('Tax setting update error:', error)
    return NextResponse.json(
      { error: 'Failed to update tax setting' },
      { status: 500 }
    )
  }
}

// DELETE /api/tax-settings - Delete tax setting (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const { searchParams } = new URL(request.url)
    const taxSettingId = searchParams.get('id')

    if (!taxSettingId) {
      return NextResponse.json(
        { error: 'Tax setting ID is required' },
        { status: 400 }
      )
    }

    const taxSetting = await TaxSetting.findByIdAndUpdate(
      taxSettingId,
      { isActive: false },
      { new: true }
    )

    if (!taxSetting) {
      return NextResponse.json(
        { error: 'Tax setting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Tax setting deactivated' }, { status: 200 })
  } catch (error) {
    console.error('Tax setting delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete tax setting' },
      { status: 500 }
    )
  }
}
