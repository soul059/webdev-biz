// Global type definitions for the project

declare global {
  var mongoose: {
    conn: any
    promise: any
  }
}

export interface ReceiptFormData {
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
    projectImages?: string[]
  }
  paymentInfo: {
    amount: number
    currency: string
    method: string
    status: 'paid' | 'pending' | 'partial'
    dueDate?: string
  }
}
