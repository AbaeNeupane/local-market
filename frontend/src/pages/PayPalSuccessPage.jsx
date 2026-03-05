import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../hooks/useApi'
import toast from 'react-hot-toast'
import { CheckCircle, Loader } from 'lucide-react'

export default function PayPalSuccessPage() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState('capturing') // capturing | success | error
  const orderId = params.get('order_id')
  const paypalOrderId = params.get('token') // PayPal passes this automatically

  useEffect(() => {
    if (!paypalOrderId || !orderId) { setStatus('error'); return }
    api.post('/api/payments/paypal/capture/', {
      paypal_order_id: paypalOrderId,
      order_id: orderId,
    }).then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [])

  if (status === 'capturing') return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4">
      <Loader className="animate-spin text-brand-400" size={40}/>
      <p className="text-gray-400">Confirming your PayPal payment...</p>
    </div>
  )

  if (status === 'error') return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-5xl">❌</p>
      <h1 className="font-display text-2xl font-bold">Payment Failed</h1>
      <p className="text-gray-400 text-center">Something went wrong capturing your PayPal payment.</p>
      <Link to="/products" className="btn-primary mt-2">Back to Shop</Link>
    </div>
  )

  return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4 px-4">
      <CheckCircle size={64} className="text-green-400"/>
      <h1 className="font-display text-3xl font-bold">Payment Successful!</h1>
      <p className="text-gray-400 text-center">Your PayPal payment was confirmed. Order #{orderId} is placed.</p>
      <div className="flex gap-3 mt-2">
        <Link to="/orders" className="btn-primary">View Orders</Link>
        <Link to="/products" className="btn-secondary">Keep Shopping</Link>
      </div>
    </div>
  )
}