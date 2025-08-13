import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Receipt from '@/models/Receipt'
import Invoice from '@/models/Invoice'
import { decrypt } from '@/lib/encryption'
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

// Convert to QuickBooks format
const toQuickBooksFormat = (data: any[], type: 'receipts' | 'invoices') => {
  return data.map(item => {
    const decryptedData = JSON.parse(decrypt(item.encryptedData))
    
    if (type === 'receipts') {
      return {
        TxnID: item.receiptId,
        TimeCreated: item.date,
        CustomerRef: {
          ListID: item.receiptId,
          FullName: decryptedData.clientInfo.name
        },
        ItemLineRet: [{
          ItemRef: {
            ListID: '1',
            FullName: decryptedData.projectDetails.title
          },
          Desc: decryptedData.projectDetails.description,
          Quantity: 1,
          UnitOfMeasure: 'Each',
          Rate: decryptedData.paymentInfo.amount,
          Amount: decryptedData.paymentInfo.amount
        }],
        Subtotal: decryptedData.paymentInfo.amount,
        TotalAmount: decryptedData.paymentInfo.amount,
        IsPaid: decryptedData.paymentInfo.status === 'paid',
        Currency: decryptedData.paymentInfo.currency
      }
    } else {
      return {
        TxnID: item.invoiceId,
        TimeCreated: item.date,
        CustomerRef: {
          ListID: item.invoiceId,
          FullName: decryptedData.clientInfo.name
        },
        InvoiceLineRet: item.items.map((lineItem: any, index: number) => ({
          TxnLineID: `${item.invoiceId}-${index}`,
          ItemRef: {
            ListID: `item-${index}`,
            FullName: lineItem.description
          },
          Desc: lineItem.description,
          Quantity: lineItem.quantity,
          Rate: lineItem.rate,
          Amount: lineItem.amount
        })),
        Subtotal: item.subtotal,
        TaxTotal: item.taxTotal,
        TotalAmount: item.total,
        IsPaid: item.status === 'paid',
        Currency: item.currency,
        DueDate: item.dueDate
      }
    }
  })
}

// Convert to Xero format
const toXeroFormat = (data: any[], type: 'receipts' | 'invoices') => {
  return data.map(item => {
    const decryptedData = JSON.parse(decrypt(item.encryptedData))
    
    if (type === 'receipts') {
      return {
        Type: 'ACCREC',
        InvoiceID: item.receiptId,
        InvoiceNumber: item.receiptId,
        Date: item.date.split('T')[0],
        DueDate: item.date.split('T')[0],
        Status: decryptedData.paymentInfo.status === 'paid' ? 'PAID' : 'AUTHORISED',
        Contact: {
          ContactID: item.receiptId,
          Name: decryptedData.clientInfo.name,
          EmailAddress: decryptedData.clientInfo.email
        },
        LineItems: [{
          Description: `${decryptedData.projectDetails.title} - ${decryptedData.projectDetails.description}`,
          Quantity: 1,
          UnitAmount: decryptedData.paymentInfo.amount,
          LineAmount: decryptedData.paymentInfo.amount,
          AccountCode: '200'
        }],
        SubTotal: decryptedData.paymentInfo.amount,
        TotalTax: 0,
        Total: decryptedData.paymentInfo.amount,
        CurrencyCode: decryptedData.paymentInfo.currency
      }
    } else {
      return {
        Type: 'ACCREC',
        InvoiceID: item.invoiceId,
        InvoiceNumber: item.invoiceId,
        Date: item.date.split('T')[0],
        DueDate: item.dueDate.split('T')[0],
        Status: item.status === 'paid' ? 'PAID' : 'AUTHORISED',
        Contact: {
          ContactID: item.invoiceId,
          Name: decryptedData.clientInfo.name,
          EmailAddress: decryptedData.clientInfo.email
        },
        LineItems: item.items.map((lineItem: any) => ({
          Description: lineItem.description,
          Quantity: lineItem.quantity,
          UnitAmount: lineItem.rate,
          LineAmount: lineItem.amount,
          TaxAmount: lineItem.taxAmount || 0,
          AccountCode: '200'
        })),
        SubTotal: item.subtotal,
        TotalTax: item.taxTotal,
        Total: item.total,
        CurrencyCode: item.currency
      }
    }
  })
}

// Convert to CSV format
const toCSVFormat = (data: any[], type: 'receipts' | 'invoices') => {
  if (data.length === 0) return ''

  let headers: string[]
  let rows: string[][]

  if (type === 'receipts') {
    headers = [
      'Receipt ID', 'Date', 'Client Name', 'Client Email', 'Project Title',
      'Amount', 'Currency', 'Status', 'Payment Method', 'Created At'
    ]
    
    rows = data.map(item => {
      const decryptedData = JSON.parse(decrypt(item.encryptedData))
      return [
        item.receiptId,
        new Date(item.date).toISOString().split('T')[0],
        decryptedData.clientInfo.name,
        decryptedData.clientInfo.email,
        decryptedData.projectDetails.title,
        decryptedData.paymentInfo.amount.toString(),
        decryptedData.paymentInfo.currency,
        decryptedData.paymentInfo.status,
        decryptedData.paymentInfo.method,
        new Date(item.createdAt).toISOString().split('T')[0]
      ]
    })
  } else {
    headers = [
      'Invoice ID', 'Date', 'Due Date', 'Client Name', 'Client Email',
      'Subtotal', 'Tax Total', 'Total', 'Currency', 'Status', 'Created At'
    ]
    
    rows = data.map(item => {
      const decryptedData = JSON.parse(decrypt(item.encryptedData))
      return [
        item.invoiceId,
        new Date(item.date).toISOString().split('T')[0],
        new Date(item.dueDate).toISOString().split('T')[0],
        decryptedData.clientInfo.name,
        decryptedData.clientInfo.email,
        item.subtotal.toString(),
        item.taxTotal.toString(),
        item.total.toString(),
        item.currency,
        item.status,
        new Date(item.createdAt).toISOString().split('T')[0]
      ]
    })
  }

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  return csvContent
}

// GET /api/export - Export data in various formats
export async function GET(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'receipts' | 'invoices' // What to export
    const format = searchParams.get('format') as 'quickbooks' | 'xero' | 'csv' // Export format
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!type || !format) {
      return NextResponse.json(
        { error: 'Type and format parameters are required' },
        { status: 400 }
      )
    }

    // Build date filter
    const dateFilter: any = { isActive: true }
    if (startDate) {
      dateFilter.createdAt = { $gte: new Date(startDate) }
    }
    if (endDate) {
      dateFilter.createdAt = { 
        ...dateFilter.createdAt,
        $lte: new Date(endDate) 
      }
    }

    // Fetch data
    let data: any[]
    if (type === 'receipts') {
      data = await Receipt.find(dateFilter).sort({ createdAt: -1 })
    } else {
      data = await Invoice.find(dateFilter).sort({ createdAt: -1 })
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'No data found for the specified criteria' },
        { status: 404 }
      )
    }

    // Convert data based on format
    let exportData: any
    let contentType: string
    let filename: string

    switch (format) {
      case 'quickbooks':
        exportData = toQuickBooksFormat(data, type)
        contentType = 'application/json'
        filename = `${type}_quickbooks_${new Date().toISOString().split('T')[0]}.json`
        break
        
      case 'xero':
        exportData = toXeroFormat(data, type)
        contentType = 'application/json'
        filename = `${type}_xero_${new Date().toISOString().split('T')[0]}.json`
        break
        
      case 'csv':
        exportData = toCSVFormat(data, type)
        contentType = 'text/csv'
        filename = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`
        break
        
      default:
        return NextResponse.json(
          { error: 'Unsupported export format' },
          { status: 400 }
        )
    }

    // Return file download
    const response = new NextResponse(format === 'csv' ? exportData : JSON.stringify(exportData, null, 2))
    response.headers.set('Content-Type', contentType)
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    
    return response
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
