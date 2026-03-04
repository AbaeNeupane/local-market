import { Link } from 'react-router-dom'
import { XCircle } from 'lucide-react'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-24 h-24 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-800/40">
          <XCircle size={48} className="text-red-400"/>
        </div>
        <h1 className="font-display text-3xl font-bold mb-3">Payment Cancelled</h1>
        <p className="text-gray-400 mb-8">Your payment was cancelled. No charges were made.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/products" className="btn-primary">Back to Shop</Link>
          <Link to="/dashboard" className="btn-secondary">Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
