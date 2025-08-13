import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Freelance Receipt Generator
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Professional receipt generator for freelance web developers. Create secure receipts with QR codes, 
            manage your projects, and track your analytics.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Admin Panel</h2>
              <p className="text-gray-600 mb-6">
                Access your admin dashboard to create receipts, view analytics, and manage your projects.
              </p>
              <Link
                href="/admin/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Admin Login
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">View Receipt</h2>
              <p className="text-gray-600 mb-6">
                Have a QR code? Scan it or enter your receipt ID to view your receipt details.
              </p>
              <Link
                href="/receipt"
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                View Receipt
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
