import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../hooks/useApi'
import { ArrowRight, ShieldCheck, Users, Zap, Star, TrendingUp } from 'lucide-react'

function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.id}`} className="card group hover:border-brand-800/60 transition-all duration-300 overflow-hidden hover:-translate-y-1">
      <div className="h-44 bg-gray-800 overflow-hidden">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
          : <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600">🛍️</div>
        }
      </div>
      <div className="p-4">
        <p className="text-xs text-brand-400 font-medium mb-1">{product.category_name || 'General'}</p>
        <h3 className="font-display font-semibold text-sm line-clamp-1 mb-1">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-3">by {product.seller_name}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-white">${product.price}</span>
          <span className="text-xs badge bg-white/5 text-gray-400">{product.condition}</span>
        </div>
      </div>
    </Link>
  )
}

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState({ products: 0, sellers: 0 })

  useEffect(() => {
    api.get('/api/products/?ordering=-created_at').then(r => {
      setProducts(r.data.results?.slice(0, 6) || r.data.slice(0, 6))
    }).catch(() => {})
    api.get('/api/products/').then(r => {
      const count = r.data.count || r.data.length || 0
      setStats(s => ({ ...s, products: count }))
    }).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/40 via-gray-950 to-gray-950 pointer-events-none"/>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-600/10 blur-[120px] rounded-full pointer-events-none"/>
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 badge bg-brand-900/60 text-brand-300 border border-brand-700/40 mb-6 py-1.5 px-4">
            <Star size={12} fill="currentColor"/> Nepal's Local Marketplace
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
            Buy & Sell<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400">Locally</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with local sellers and buyers. Pay with eSewa, Stripe, or PayPal. Secure, fast, community-powered.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/products" className="btn-primary flex items-center gap-2 text-base px-7 py-3">
              Browse Products <ArrowRight size={18}/>
            </Link>
            <Link to="/register" className="btn-secondary flex items-center gap-2 text-base px-7 py-3">
              Start Selling
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-white/5 bg-white/2">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          {[
            { value: stats.products, label: 'Products Listed', icon: '📦' },
            { value: '100%', label: 'Secure Payments', icon: '🔒' },
            { value: 'NPR/USD', label: 'Multi-Currency', icon: '💱' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-display text-3xl font-bold text-white">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-gray-500 text-sm font-medium mb-6 uppercase tracking-widest">Accepted Payment Methods</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: 'eSewa', color: 'bg-green-900/40 text-green-400 border-green-800/40', emoji: '🟢' },
              { name: 'Stripe / Card', color: 'bg-blue-900/40 text-blue-400 border-blue-800/40', emoji: '💳' },
              { name: 'PayPal', color: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/40', emoji: '🅿️' },
              { name: 'Mastercard', color: 'bg-red-900/40 text-red-400 border-red-800/40', emoji: '🔴' },
              { name: 'Visa', color: 'bg-indigo-900/40 text-indigo-400 border-indigo-800/40', emoji: '🔵' },
              { name: 'Khalti', color: 'bg-purple-900/40 text-purple-400 border-purple-800/40', emoji: '🟣' },
            ].map(p => (
              <div key={p.name} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${p.color}`}>
                <span>{p.emoji}</span> {p.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-brand-400 text-sm font-medium mb-1 flex items-center gap-1.5"><TrendingUp size={14}/> Trending Now</p>
                <h2 className="font-display text-3xl font-bold">Latest Products</h2>
              </div>
              <Link to="/products" className="text-brand-400 hover:text-brand-300 text-sm font-medium flex items-center gap-1">
                View all <ArrowRight size={15}/>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p}/>)}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-brand-950/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-12">Why Local Market?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <ShieldCheck className="text-brand-400" size={28}/>, title: 'Secure Payments', desc: 'Stripe, eSewa, PayPal — all payments are encrypted and verified.' },
              { icon: <Users className="text-accent-400" size={28}/>, title: 'Community First', desc: 'Support Nepali local sellers. Keep money in the community.' },
              { icon: <Zap className="text-yellow-400" size={28}/>, title: 'Instant Payouts', desc: 'Sellers receive payments directly via Stripe Connect.' },
            ].map((f, i) => (
              <div key={i} className="card p-6 hover:border-white/10 transition-colors">
                <div className="mb-4">{f.icon}</div>
                <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
