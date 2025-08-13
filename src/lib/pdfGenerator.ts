import jsPDF from 'jspdf'

interface ReceiptData {
  receiptId: string
  date: string
  clientInfo: {
    name: string
    email: string
    phone: string
    address: string
  }
  freelancerInfo: {
    name: string
    email: string
    phone: string
    address: string
    website?: string
  }
  projectDetails: {
    title: string
    description: string
    technologies: string[]
    deliverables: string[]
    websiteUrl?: string
  }
  paymentInfo: {
    amount: number
    currency: string
    method: string
    status: string
    dueDate?: string
  }
}

export const generateReceiptPDF = (receipt: ReceiptData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // A4 dimensions: 210 x 297 mm
  const pageWidth = 210
  const pageHeight = 297
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  
  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246] // Blue
  const darkGray: [number, number, number] = [55, 65, 81]
  const lightGray: [number, number, number] = [107, 114, 128]
  
  // Fonts
  doc.setFont('helvetica')
  
  let yPosition = margin

  // Header
  doc.setFontSize(28)
  doc.setTextColor(...primaryColor)
  doc.text('RECEIPT', margin, yPosition)
  
  yPosition += 15
  
  // Receipt ID and Date
  doc.setFontSize(12)
  doc.setTextColor(...darkGray)
  doc.text(`Receipt ID: ${receipt.receiptId}`, margin, yPosition)
  doc.text(`Date: ${new Date(receipt.date).toLocaleDateString()}`, pageWidth - margin - 50, yPosition)
  
  yPosition += 15
  
  // Line separator
  doc.setDrawColor(...lightGray)
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  
  yPosition += 10
  
  // From and To sections (side by side)
  const columnWidth = contentWidth / 2
  
  // From section
  doc.setFontSize(14)
  doc.setTextColor(...darkGray)
  doc.text('FROM', margin, yPosition)
  
  yPosition += 8
  doc.setFontSize(10)
  doc.text(receipt.freelancerInfo.name || 'N/A', margin, yPosition)
  yPosition += 5
  doc.text(receipt.freelancerInfo.email || 'N/A', margin, yPosition)
  yPosition += 5
  doc.text(receipt.freelancerInfo.phone || 'N/A', margin, yPosition)
  yPosition += 5
  doc.text(receipt.freelancerInfo.address || 'N/A', margin, yPosition, { maxWidth: columnWidth - 10 })
  if (receipt.freelancerInfo.website) {
    yPosition += 5
    doc.text(receipt.freelancerInfo.website, margin, yPosition)
  }
  
  // To section (same Y positions)
  let toYPosition = yPosition - (receipt.freelancerInfo.website ? 25 : 20)
  doc.setFontSize(14)
  doc.text('TO', margin + columnWidth, toYPosition)
  
  toYPosition += 8
  doc.setFontSize(10)
  doc.text(receipt.clientInfo.name || 'N/A', margin + columnWidth, toYPosition)
  toYPosition += 5
  doc.text(receipt.clientInfo.email || 'N/A', margin + columnWidth, toYPosition)
  toYPosition += 5
  doc.text(receipt.clientInfo.phone || 'N/A', margin + columnWidth, toYPosition)
  toYPosition += 5
  doc.text(receipt.clientInfo.address || 'N/A', margin + columnWidth, toYPosition, { maxWidth: columnWidth - 10 })
  
  yPosition += 15
  
  // Project Details section
  doc.setFontSize(14)
  doc.setTextColor(...darkGray)
  doc.text('PROJECT DETAILS', margin, yPosition)
  
  yPosition += 10
  doc.setFontSize(12)
  doc.setTextColor(...primaryColor)
  doc.text(receipt.projectDetails.title || 'N/A', margin, yPosition)
  
  yPosition += 8
  doc.setFontSize(10)
  doc.setTextColor(...darkGray)
  const description = receipt.projectDetails.description || 'N/A'
  const descriptionLines = doc.splitTextToSize(description, contentWidth)
  doc.text(descriptionLines, margin, yPosition)
  yPosition += descriptionLines.length * 5
  
  // Website URL
  if (receipt.projectDetails.websiteUrl) {
    yPosition += 3
    doc.text(`Website: ${receipt.projectDetails.websiteUrl}`, margin, yPosition)
    yPosition += 8
  }
  
  // Technologies
  if (receipt.projectDetails.technologies.length > 0) {
    yPosition += 3
    doc.text('Technologies: ' + receipt.projectDetails.technologies.join(', '), margin, yPosition, { maxWidth: contentWidth })
    yPosition += 8
  }
  
  // Deliverables
  if (receipt.projectDetails.deliverables.length > 0) {
    yPosition += 3
    doc.text('Deliverables:', margin, yPosition)
    yPosition += 5
    receipt.projectDetails.deliverables.forEach((deliverable, index) => {
      doc.text(`• ${deliverable}`, margin + 5, yPosition)
      yPosition += 5
    })
    yPosition += 3
  }
  
  // Line separator
  yPosition += 5
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10
  
  // Payment Information
  doc.setFontSize(14)
  doc.setTextColor(...darkGray)
  doc.text('PAYMENT INFORMATION', margin, yPosition)
  
  yPosition += 10
  
  // Payment details in a box
  const paymentBoxHeight = 35
  doc.setDrawColor(...lightGray)
  doc.setFillColor(248, 250, 252) // Light gray background
  doc.roundedRect(margin, yPosition, contentWidth, paymentBoxHeight, 3, 3, 'FD')
  
  yPosition += 8
  
  // Amount (large and prominent)
  doc.setFontSize(18)
  doc.setTextColor(...primaryColor)
  doc.text(`${receipt.paymentInfo.currency} ${receipt.paymentInfo.amount.toLocaleString()}`, margin + 10, yPosition)
  
  yPosition += 12
  doc.setFontSize(10)
  doc.setTextColor(...darkGray)
  doc.text(`Payment Method: ${receipt.paymentInfo.method}`, margin + 10, yPosition)
  doc.text(`Status: ${receipt.paymentInfo.status.toUpperCase()}`, margin + 100, yPosition)
  
  if (receipt.paymentInfo.dueDate) {
    yPosition += 5
    doc.text(`Due Date: ${new Date(receipt.paymentInfo.dueDate).toLocaleDateString()}`, margin + 10, yPosition)
  }
  
  yPosition += 20
  
  // Footer
  yPosition = pageHeight - 40 // Position from bottom
  doc.setDrawColor(...lightGray)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8
  
  doc.setFontSize(9)
  doc.setTextColor(...lightGray)
  doc.text('This is a digitally generated receipt.', margin, yPosition)
  doc.text('Generated on: ' + new Date().toLocaleString(), pageWidth - margin - 60, yPosition)
  
  // Contact info
  yPosition += 6
  if (receipt.freelancerInfo.email) {
    doc.text(`For queries contact: ${receipt.freelancerInfo.email}`, margin, yPosition)
  }
  
  return doc
}

export const downloadReceiptPDF = (receipt: ReceiptData) => {
  const doc = generateReceiptPDF(receipt)
  doc.save(`receipt-${receipt.receiptId}.pdf`)
}

export const printReceiptPDF = (receipt: ReceiptData) => {
  const doc = generateReceiptPDF(receipt)
  doc.autoPrint()
  window.open(doc.output('bloburl'), '_blank')
}
