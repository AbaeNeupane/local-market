import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { ArrowLeft, ShoppingCart, Edit, Trash2, Eye, Package, User, MapPin } from 'lucide-react'
import ReviewsSection from '../components/ReviewsSection'
import StarRating from '../components/StarRating'

function PaymentModal({ product, onClose }) {
  const [method, setMethod] = useState('stripe')
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)

  const paymentMethods = [
    { id: 'stripe', label: 'Card (Stripe)', desc: 'Visa, Mastercard, etc.', flag: '💳', currency: 'USD' },
    { id: 'esewa', label: 'eSewa', desc: 'Nepal local payment', flag: '🟢', currency: 'NPR' },
    { id: 'paypal', label: 'PayPal', desc: 'Pay with PayPal', flag: '🅿️', currency: 'USD' },
  ]

  const handlePay = async () => {
    setLoading(true)
    try {
      if (method === 'stripe') {
        const res = await api.post(`/api/payments/stripe/checkout/${product.id}/`, { quantity: qty })
        window.location.href = res.data.checkout_url

      } else if (method === 'esewa') {
        const res = await api.post(`/api/payments/esewa/init/${product.id}/`, { quantity: qty })
        const { esewa_url, form_data } = res.data
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = esewa_url
        Object.entries(form_data).forEach(([k, v]) => {
          const i = document.createElement('input')
          i.type = 'hidden'; i.name = k; i.value = v
          form.appendChild(i)
        })
        document.body.appendChild(form)
        form.submit()

      } else if (method === 'paypal') {
        const res = await api.post(`/api/payments/paypal/create/${product.id}/`, { quantity: qty })
        window.location.href = res.data.approval_url
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed')
      setLoading(false)
    }
  }

  const total = (product.price * qty).toFixed(2)

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md overflow-hidden animate-fade-up">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-display font-bold text-lg">Complete Purchase</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {/* Product Summary */}
          <div className="flex gap-3 p-3 bg-white/5 rounded-xl">
            {product.image_url && <img src={product.image_url} className="w-14 h-14 rounded-lg object-cover"/>}
            <div>
              <p className="font-semibold text-sm">{product.name}</p>
              <p className="text-brand-400 font-bold">${product.price} each</p>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="label">Quantity</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center font-bold">-</button>
              <span className="font-bold text-lg w-8 text-center">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center font-bold">+</button>
              <span className="text-xs text-gray-500">/ {product.stock} in stock</span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="label">Payment Method</label>
            <div className="space-y-2">
              {paymentMethods.map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${method === m.id ? 'border-brand-500 bg-brand-900/20' : 'border-white/10 hover:border-white/20'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{m.flag}</span>
                    <div>
                      <p className="font-medium text-sm">{m.label}</p>
                      <p className="text-xs text-gray-500">{m.desc}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{m.currency}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
            <span className="text-gray-400">Total</span>
            <span className="font-display font-bold text-xl">${total}</span>
          </div>

          <button onClick={handlePay} disabled={loading} className="btn-primary w-full py-3.5 justify-center flex text-base">
            {loading ? 'Processing...' : `Pay $${total} via ${method === 'stripe' ? 'Card' : method === 'esewa' ? 'eSewa' : 'PayPal'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [rating, setRating] = useState(null)

  useEffect(() => {
    api.get(`/api/products/${id}/`).then(r => setProduct(r.data)).catch(() => navigate('/products')).finally(() => setLoading(false))
    api.get(`/api/products/${id}/rating/`).then(r => setRating(r.data)).catch(() => {})
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Delete this product?')) return
    await api.delete(`/api/products/${id}/`)
    toast.success('Product deleted')
    navigate('/products')
  }

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center text-gray-500">Loading...</div>
  if (!product) return null

  const isOwner = user?.id === product.seller?.id
  const canBuy = user && !isOwner && product.stock > 0

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16}/> Back
        </button>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Image */}
          <div className="card overflow-hidden aspect-square">
            {product.image_url
              ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center text-8xl text-gray-600">📦</div>}
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.category && <span className="badge bg-brand-900/40 text-brand-400">{product.category.name}</span>}
                <span className="badge bg-white/5 text-gray-400">{product.condition}</span>
                {product.stock === 0 && <span className="badge bg-red-900/40 text-red-400">Out of Stock</span>}
              </div>
              <h1 className="font-display text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-4xl font-display font-bold text-brand-400">${product.price}</p>
              {/* Rating summary */}
              {rating && rating.total > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <StarRating value={Math.round(rating.average)} size={16}/>
                  <span className="text-sm text-gray-400">{rating.average} ({rating.total} reviews)</span>
                </div>
              )}
            </div>

            <p className="text-gray-400 leading-relaxed text-sm">{product.description}</p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2.5 text-gray-400">
                <User size={15} className="text-gray-600"/>
                Sold by <span className="text-white font-medium">{product.seller?.username}</span>
              </div>
              {product.seller?.profile?.city && (
                <div className="flex items-center gap-2.5 text-gray-400">
                  <MapPin size={15} className="text-gray-600"/>
                  {product.seller.profile.city}, {product.seller.profile.country}
                </div>
              )}
              <div className="flex items-center gap-2.5 text-gray-400">
                <Package size={15} className="text-gray-600"/>
                {product.stock} in stock
              </div>
              <div className="flex items-center gap-2.5 text-gray-400">
                <Eye size={15} className="text-gray-600"/>
                {product.views_count} views
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {canBuy && (
                <button onClick={() => setShowPayment(true)} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3.5">
                  <ShoppingCart size={18}/> Buy Now
                </button>
              )}
              {!user && (
                <Link to="/login" className="btn-primary flex-1 flex items-center justify-center gap-2 py-3.5">
                  Login to Buy
                </Link>
              )}
              {isOwner && (
                <>
                  <Link to={`/products/${id}/edit`} className="btn-secondary flex items-center gap-2 py-3">
                    <Edit size={16}/> Edit
                  </Link>
                  <button onClick={handleDelete} className="px-4 py-3 rounded-xl bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 transition-all">
                    <Trash2 size={16}/>
                  </button>
                </>
              )}
              {product.stock === 0 && !isOwner && (
                <div className="flex-1 py-3 text-center text-gray-500 bg-white/5 rounded-xl text-sm">Out of Stock</div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <ReviewsSection productId={id}/>
      </div>

      {showPayment && <PaymentModal product={product} onClose={() => setShowPayment(false)}/>}
    </div>
  )
}