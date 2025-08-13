import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { EmailTemplate, EmailLog } from '@/models/Email'
import { sendEmail, generateEmailFromTemplate } from '@/lib/email'
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

// Replace variables in template
const replaceVariables = (content: string, variables: Record<string, string>) => {
  let result = content
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
  })
  return result
}

// GET /api/email - Get email templates and logs
export async function GET(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'templates' or 'logs'

    if (type === 'templates') {
      const templates = await EmailTemplate.find({ isActive: true }).sort({ isDefault: -1, name: 1 })
      return NextResponse.json({ templates }, { status: 200 })
    }

    if (type === 'logs') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const skip = (page - 1) * limit

      const [logs, totalLogs] = await Promise.all([
        EmailLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
        EmailLog.countDocuments()
      ])

      const totalPages = Math.ceil(totalLogs / limit)

      return NextResponse.json({
        logs,
        pagination: {
          currentPage: page,
          totalPages,
          totalLogs,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }, { status: 200 })
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch (error) {
    console.error('Email fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email data' },
      { status: 500 }
    )
  }
}

// POST /api/email - Send email or create template
export async function POST(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()

    // If creating a template
    if (body.action === 'create_template') {
      const template = new EmailTemplate(body.template)

      // If this is set as default, unset other defaults of the same type
      if (template.isDefault) {
        await EmailTemplate.updateMany(
          { type: template.type, isDefault: true },
          { isDefault: false }
        )
      }

      await template.save()
      return NextResponse.json({ template }, { status: 201 })
    }

    // If sending an email
    if (body.action === 'send_email') {
      const { to, templateType, variables, receiptId, invoiceId } = body

      // Get the template
      const template = await EmailTemplate.findOne({ 
        type: templateType, 
        isActive: true,
        $or: [{ isDefault: true }, { _id: body.templateId }]
      }).sort({ isDefault: -1 })

      if (!template) {
        return NextResponse.json(
          { error: 'Email template not found' },
          { status: 404 }
        )
      }

      // Create email log entry
      const emailLog = new EmailLog({
        to,
        subject: replaceVariables(template.subject, variables),
        templateType,
        receiptId,
        invoiceId,
        status: 'pending'
      })

      try {
        // Prepare email content
        const htmlContent = generateEmailFromTemplate(template.htmlContent, variables)
        const subject = generateEmailFromTemplate(template.subject, variables)

        // Send email using nodemailer
        const emailResult = await sendEmail({
          to,
          subject,
          html: htmlContent,
          text: generateEmailFromTemplate(template.textContent || '', variables)
        })

        // Update email log as sent
        emailLog.status = 'sent'
        emailLog.sentAt = new Date()
        emailLog.messageId = emailResult.messageId
        await emailLog.save()

        return NextResponse.json({ 
          message: 'Email sent successfully',
          emailLog,
          previewUrl: emailResult.previewUrl // For development testing
        }, { status: 200 })
      } catch (error: any) {
        // Update email log with error
        emailLog.status = 'failed'
        emailLog.error = error.message
        await emailLog.save()

        throw error
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Email operation error:', error)
    return NextResponse.json(
      { error: 'Failed to process email operation' },
      { status: 500 }
    )
  }
}

// PUT /api/email - Update email template
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
      const template = await EmailTemplate.findById(templateId)
      if (template) {
        await EmailTemplate.updateMany(
          { type: template.type, isDefault: true, _id: { $ne: templateId } },
          { isDefault: false }
        )
      }
    }

    const template = await EmailTemplate.findByIdAndUpdate(
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
    console.error('Email template update error:', error)
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    )
  }
}
