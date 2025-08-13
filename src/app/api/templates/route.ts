import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Template from '@/models/Template'
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

// GET /api/templates - Get all templates
export async function GET(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'receipt' or 'invoice'
    const activeOnly = searchParams.get('active') === 'true'

    const filter: any = {}
    if (type) filter.type = type
    if (activeOnly) filter.isActive = true

    const templates = await Template.find(filter).sort({ isDefault: -1, name: 1 })

    return NextResponse.json({ templates }, { status: 200 })
  } catch (error) {
    console.error('Templates fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST /api/templates - Create new template (admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()

    const template = new Template({
      ...body,
      createdBy: admin.email
    })

    // If this is set as default, unset other defaults of the same type
    if (template.isDefault) {
      await Template.updateMany(
        { type: template.type, isDefault: true },
        { isDefault: false }
      )
    }

    await template.save()

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Template creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

// PUT /api/templates - Update template (admin only)
export async function PUT(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()
    const { templateId, ...updateData } = body

    // If setting as default, unset other defaults of the same type
    if (updateData.isDefault) {
      const template = await Template.findById(templateId)
      if (template) {
        await Template.updateMany(
          { type: template.type, isDefault: true, _id: { $ne: templateId } },
          { isDefault: false }
        )
      }
    }

    const template = await Template.findByIdAndUpdate(
      templateId,
      updateData,
      { new: true }
    )

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template }, { status: 200 })
  } catch (error) {
    console.error('Template update error:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE /api/templates - Delete template (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const template = await Template.findByIdAndUpdate(
      templateId,
      { isActive: false },
      { new: true }
    )

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Template deactivated' }, { status: 200 })
  } catch (error) {
    console.error('Template delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
