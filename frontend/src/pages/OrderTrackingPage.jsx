import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Package, Truck, CheckCircle, Clock, MapPin, ArrowLeft, Edit3 } from 'lucide-react'

const STATUS_ICONS = {
  order_placed:     '📋', confirmed: '✅', processing: '⚙️',
  packed: '📦', shipped: '🚚', out_for_delivery: '🏠',
  delivered: '🎉', cancelled: '❌', return_initiated: '↩️', returned: '🔄',
}
const STATUS_COLORS = {
  order_placed: 'text-gray-400', confirmed: 'text-blue-400',
  processing: 'text-yellow-400', packed: 'text-orange-400',
  shipped: 'text-purple-400', out_for_delivery: 'text-brand-400',
  delivered: 'text-green-400', cancelled: 'text-red-400',
}

function UpdateStatusModal({ orderId, onClose, onUpdated }) {
  const [form, setForm] = useState({ status: 'confirmed', message: '', location: '' })
  const [loading, setLoading] = useState(false)

  const statuses = [
    'confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','refunded'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post(`/api/orders/${orderId}/update-status/`, form)
      toast.success('Order status updated!')
      onUpdated()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-lg">Update Order Status</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">New Status</label>
            <select className="input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
              {statuses.map(s => <option key={s} value={s}>{STATUS_ICONS[s]} {s.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Message to Buyer</label>
            <textarea className="input" rows={3} placeholder="e.g. Your order has been packed and will ship tomorrow."
              value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/>
          </div>
          <div>
            <label className="label">Location (optional)</label>
            <input className="input" placeholder="e.g. Kathmandu Sorting Center"
              value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
              {loading ? 'Updating...' : 'Update Status'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary px-5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddTrackingModal({ orderId, onClose, onUpdated }) {
  const [form, setForm] = useState({ courier: 'nepal_post', tracking_number: '', tracking_url: '', estimated_delivery: '', notes: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post(`/api/orders/${orderId}/tracking-info/`, form)
      toast.success('Tracking info added!')
      onUpdated()
      onClose()
    } catch { toast.error('Failed to save tracking info') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-lg">Add Tracking Info</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Courier</label>
            <select className="input" value={form.courier} onChange={e=>setForm({...form,courier:e.target.value})}>
              {['nepal_post','dhl','fedex','aramex','bluedart','custom'].map(c =>
                <option key={c} value={c}>{c.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>
              )}
            </select>
          </div>
          <div>
            <label className="label">Tracking Number *</label>
            <input className="input" required placeholder="e.g. EG123456789NP"
              value={form.tracking_number} onChange={e=>setForm({...form,tracking_number:e.target.value})}/>
          </div>
          <div>
            <label className="label">Tracking URL</label>
            <input className="input" type="url" placeholder="https://..."
              value={form.tracking_url} onChange={e=>setForm({...form,tracking_url:e.target.value})}/>
          </div>
          <div>
            <label className="label">Estimated Delivery</label>
            <input className="input" type="date"
              value={form.estimated_delivery} onChange={e=>setForm({...form,estimated_delivery:e.target.value})}/>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
              {loading ? 'Saving...' : 'Save Tracking'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary px-5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function OrderTrackingPage() {
  const { orderId } = useParams()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showStatus, setShowStatus] = useState(false)
  const [showTracking, setShowTracking] = useState(false)

  const load = async () => {
    try {
      const res = await api.get(`/api/orders/${orderId}/tracking/`)
      setData(res.data)
    } catch { toast.error('Could not load tracking info') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [orderId])

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center text-gray-500">Loading...</div>
  if (!data) return null

  const isSeller = user?.username === data.seller

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link to="/orders" className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-4"><ArrowLeft size={15}/>Orders</Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold">Order #{data.order_id}</h1>
              <p className="text-gray-500 text-sm mt-1">{data.product_name}</p>
            </div>
            {isSeller && (
              <div className="flex gap-2">
                <button onClick={()=>setShowStatus(true)} className="btn-primary text-sm py-2 flex items-center gap-1.5">
                  <Edit3 size={14}/> Update Status
                </button>
                <button onClick={()=>setShowTracking(true)} className="btn-secondary text-sm py-2 flex items-center gap-1.5">
                  <Truck size={14}/> Add Tracking
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="card p-5 mb-5 grid grid-cols-2 gap-4">
          <div><p className="text-xs text-gray-500">Buyer</p><p className="font-semibold">{data.buyer}</p></div>
          <div><p className="text-xs text-gray-500">Seller</p><p className="font-semibold">{data.seller}</p></div>
          <div><p className="text-xs text-gray-500">Total</p><p className="font-semibold">${data.amount}</p></div>
          <div><p className="text-xs text-gray-500">Payment</p><p className="font-semibold">{data.payment_method}</p></div>
        </div>

        {/* Tracking Info */}
        {data.tracking_info?.tracking_number && (
          <div className="card p-5 mb-5 border border-brand-800/40">
            <div className="flex items-center gap-2 mb-3">
              <Truck size={18} className="text-brand-400"/>
              <h3 className="font-semibold">Shipping Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-500 text-xs">Courier</p><p>{data.tracking_info.courier_display}</p></div>
              <div><p className="text-gray-500 text-xs">Tracking #</p>
                {data.tracking_info.tracking_url
                  ? <a href={data.tracking_info.tracking_url} target="_blank" rel="noopener" className="text-brand-400 hover:underline font-mono text-xs">{data.tracking_info.tracking_number}</a>
                  : <p className="font-mono text-xs">{data.tracking_info.tracking_number}</p>}
              </div>
              {data.tracking_info.estimated_delivery && (
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs">Estimated Delivery</p>
                  <p className="text-green-400 font-semibold">{new Date(data.tracking_info.estimated_delivery).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="card p-5">
          <h3 className="font-display font-semibold mb-5">Order Timeline</h3>
          {data.timeline.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock size={32} className="mx-auto mb-2 opacity-30"/>
              <p className="text-sm">No updates yet</p>
            </div>
          ) : (
            <div className="relative">
              {/* vertical line */}
              <div className="absolute left-4 top-2 bottom-2 w-px bg-white/10"/>
              <div className="space-y-6">
                {[...data.timeline].reverse().map((update, i) => (
                  <div key={update.id} className="flex gap-5 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 text-sm ${i===0?'bg-brand-700':'bg-gray-800'}`}>
                      {STATUS_ICONS[update.status] || '•'}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold text-sm ${STATUS_COLORS[update.status]||'text-gray-300'}`}>
                          {update.status_display}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(update.timestamp).toLocaleString()}</p>
                      </div>
                      {update.message && <p className="text-sm text-gray-400 mt-1">{update.message}</p>}
                      {update.location && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin size={11}/>{update.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showStatus && <UpdateStatusModal orderId={orderId} onClose={()=>setShowStatus(false)} onUpdated={load}/>}
      {showTracking && <AddTrackingModal orderId={orderId} onClose={()=>setShowTracking(false)} onUpdated={load}/>}
    </div>
  )
}
