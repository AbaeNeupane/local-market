import { useState, useEffect } from 'react'
import api from '../hooks/useApi'
import { Link } from 'react-router-dom'
import { Package, MapPin } from 'lucide-react'

const statusColors = {
  pending: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/30',
  processing: 'bg-blue-900/40 text-blue-400 border-blue-800/30',
  completed: 'bg-green-900/40 text-green-400 border-green-800/30',
  cancelled: 'bg-gray-800 text-gray-400 border-gray-700',
  failed: 'bg-red-900/40 text-red-400 border-red-800/30',
  refunded: 'bg-purple-900/40 text-purple-400 border-purple-800/30',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/orders/').then(r => setOrders(r.data.results || r.data)).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center text-gray-500">Loading...</div>

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-bold mb-8">Orders</h1>
        {orders.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <Package size={48} className="mx-auto mb-4 opacity-30"/>
            <p className="text-lg font-display font-semibold">No orders yet</p>
            <Link to="/products" className="btn-primary mt-4 inline-flex">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(o => (
              <div key={o.id} className="card p-5 flex items-center gap-5">
                <div className="w-16 h-16 bg-gray-800 rounded-xl overflow-hidden shrink-0">
                  {o.product_image
                    ? <img src={o.product_image} className="w-full h-full object-cover"/>
                    : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{o.product_name}</p>
                  <p className="text-sm text-gray-500">Order #{o.id} · {new Date(o.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Qty: {o.quantity} · via {o.payment_method}</p>
                </div>
                <Link to={`/orders/${o.id}/tracking`} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 mt-2"><MapPin size={11}/>Track</Link>
                <div className="text-right shrink-0">
                  <p className="font-bold text-lg">${o.amount}</p>
                  <span className={`badge border text-xs ${statusColors[o.status]||'bg-gray-800 text-gray-400'}`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
