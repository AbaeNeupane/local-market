import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')

  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-24 h-24 bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-800/50">
          <CheckCircle size={48} className="text-green-400"/>
        </div>
        <h1 className="font-display text-3xl font-bold mb-3">Payment Successful!</h1>
        <p className="text-gray-400 mb-2">Your order #{orderId} has been placed.</p>
        <p className="text-sm text-gray-500 mb-8">The seller has been notified and will process your order soon.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/orders" className="btn-primary">View Orders</Link>
          <Link to="/products" className="btn-secondary">Keep Shopping</Link>
        </div>
      </div>
    </div>
  )
}
