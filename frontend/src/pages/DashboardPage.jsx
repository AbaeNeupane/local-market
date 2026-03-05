import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { TrendingUp, BarChart2, ShoppingBag, Package, DollarSign, Clock, CheckCircle, Plus, CreditCard, AlertTriangle, ExternalLink } from 'lucide-react'

const statusColors = {
  pending: 'bg-yellow-900/40 text-yellow-400',
  processing: 'bg-blue-900/40 text-blue-400',
  shipped: 'bg-purple-900/40 text-purple-400',
  completed: 'bg-green-900/40 text-green-400',
  delivered: 'bg-green-900/40 text-green-400',
  cancelled: 'bg-gray-800 text-gray-400',
  failed: 'bg-red-900/40 text-red-400',
  refunded: 'bg-purple-900/40 text-purple-400',
}

function StatCard({ icon, value, label, sub, color }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-display font-bold">{value}</p>
        <p className="text-gray-400 text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function OrderRow({ order }) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-white/2 rounded-xl transition-colors">
      <div className="w-10 h-10 bg-gray-800 rounded-lg overflow-hidden shrink-0">
        {order.product_image
          ? <img src={order.product_image} className="w-full h-full object-cover"/>
          : <div className="w-full h-full flex items-center justify-center text-sm">📦</div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{order.product_name}</p>
        <p className="text-xs text-gray-500">Order #{order.id} · {new Date(order.created_at).toLocaleDateString()}</p>
      </div>
      <div className="text-right shrink-0 flex flex-col items-end gap-1">
        <p className="font-semibold text-sm">${order.amount}</p>
        <span className={`badge text-xs ${statusColors[order.status]||'bg-gray-800 text-gray-400'}`}>{order.status_display || order.status}</span>
      </div>
      <Link to={`/orders/${order.id}/tracking`} className="text-gray-600 hover:text-brand-400 transition-colors ml-1" title="Track order">
        <TrendingUp size={15}/>
      </Link>
    </div>
  )
}

function StripeOnboardBanner({ stripeStatus }) {
  if (!stripeStatus || stripeStatus.onboard_status === 'complete') return null
  const isPending = stripeStatus.onboard_status === 'pending'
  return (
    <div className={`rounded-2xl p-5 mb-6 border flex items-start gap-4 ${isPending ? 'bg-yellow-900/20 border-yellow-800/40' : 'bg-brand-900/20 border-brand-800/40'}`}>
      <div className={`p-2.5 rounded-xl shrink-0 ${isPending ? 'bg-yellow-900/40' : 'bg-brand-900/40'}`}>
        {isPending ? <AlertTriangle className="text-yellow-400" size={20}/> : <CreditCard className="text-brand-400" size={20}/>}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm mb-0.5">
          {isPending ? '⚠️ Complete your Stripe setup' : '💳 Connect your bank to receive payments'}
        </p>
        <p className="text-gray-400 text-xs leading-relaxed">
          {isPending
            ? 'Your Stripe account needs more information before you can receive payments.'
            : 'Set up Stripe Connect to receive 90% of every sale directly to your bank account.'}
        </p>
      </div>
      <Link to="/seller/stripe" className="btn-primary text-sm py-2 flex items-center gap-1.5 shrink-0">
        {isPending ? 'Continue Setup' : 'Connect Stripe'} <ExternalLink size={13}/>
      </Link>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const isSeller = user?.profile?.user_type === 'seller'

  useEffect(() => {
    api.get('/api/dashboard/stats/').then(r => setStats(r.data)).catch(()=>{}).finally(()=>setLoading(false))
    if (isSeller) {
      api.get('/api/products/my_products/').then(r => setProducts(r.data.results || r.data)).catch(()=>{})
    }
  }, [isSeller])

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center text-gray-500">Loading...</div>

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-brand-400 text-sm font-medium mb-1">
              {isSeller ? '🏪 Seller Dashboard' : '🛍️ Buyer Dashboard'}
            </p>
            <h1 className="font-display text-3xl font-bold">Hey, {user?.first_name || user?.username}! 👋</h1>
            <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</p>
          </div>
          {isSeller && (
            <div className="flex gap-2">
              <Link to="/seller/stripe" className="btn-secondary flex items-center gap-1.5 text-sm py-2">
                <CreditCard size={14}/> Payments
              </Link>
              <Link to="/products/add" className="btn-primary flex items-center gap-2">
                <Plus size={16}/> Add Product
              </Link>
            </div>
          )}
        </div>

        {/* Stripe Banner for sellers */}
        {isSeller && <StripeOnboardBanner stripeStatus={stats?.stripe_status}/>}

        {/* Stats */}
        {stats && (
          <div className={`grid grid-cols-2 ${isSeller ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 mb-8`}>
            {isSeller ? (
              <>
                <StatCard icon={<Package size={20}/>} value={stats.total_products} label="Products" color="bg-brand-900/40 text-brand-400" sub="Total listings"/>
                <StatCard icon={<CheckCircle size={20}/>} value={stats.total_sales} label="Sales" color="bg-green-900/40 text-green-400" sub="Completed orders"/>
                <StatCard icon={<DollarSign size={20}/>} value={`$${stats.total_revenue?.toFixed(2)||0}`} label="Revenue" color="bg-accent-900/40 text-accent-400" sub="After 10% fee"/>
                <StatCard icon={<Clock size={20}/>} value={stats.pending_orders} label="Pending" color="bg-yellow-900/40 text-yellow-400" sub="Awaiting action"/>
              </>
            ) : (
              <>
                <StatCard icon={<ShoppingBag size={20}/>} value={stats.total_orders} label="Orders" color="bg-brand-900/40 text-brand-400" sub="Total placed"/>
                <StatCard icon={<DollarSign size={20}/>} value={`$${stats.total_spent?.toFixed(2)||0}`} label="Total Spent" color="bg-accent-900/40 text-accent-400" sub="All time"/>
                <StatCard icon={<CheckCircle size={20}/>} value={stats.recent_orders?.filter(o=>o.status==='completed').length||0} label="Completed" color="bg-green-900/40 text-green-400" sub="This period"/>
              </>
            )}
          </div>
        )}

        <div className={`grid ${isSeller ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
          <div className={`card p-5 ${isSeller ? 'lg:col-span-2' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg">{isSeller ? 'Recent Sales' : 'Recent Orders'}</h2>
              <Link to="/orders" className="text-brand-400 hover:text-brand-300 text-sm">View all</Link>
            </div>
            {stats?.recent_orders?.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p className="text-3xl mb-3">📭</p>
                <p className="text-sm">{isSeller ? 'No sales yet.' : 'No orders yet.'}</p>
                <Link to="/products" className="btn-primary mt-4 inline-flex text-sm py-2">Browse Products</Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {stats?.recent_orders?.map(o => <OrderRow key={o.id} order={o}/>)}
              </div>
            )}
          </div>

          {isSeller && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg">My Products</h2>
                <Link to="/products/add" className="text-brand-400 hover:text-brand-300 text-sm">+ Add</Link>
              </div>
              {products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-3xl mb-2">📦</p>
                  <p className="text-sm">No products listed yet</p>
                  <Link to="/products/add" className="btn-primary mt-3 inline-flex text-sm py-2">Add First Product</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.slice(0,5).map(p => (
                    <Link key={p.id} to={`/products/${p.id}`} className="flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-xl transition-colors">
                      <div className="w-10 h-10 bg-gray-800 rounded-lg overflow-hidden shrink-0">
                        {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-sm">📦</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">${p.price} · {p.stock} left</p>
                      </div>
                      <span className={`badge text-xs ${p.stock>0?'bg-green-900/40 text-green-400':'bg-red-900/40 text-red-400'}`}>
                        {p.stock>0?'Active':'Sold out'}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}