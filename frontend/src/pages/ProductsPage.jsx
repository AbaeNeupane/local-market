import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../hooks/useApi'
import { Search, SlidersHorizontal, X } from 'lucide-react'

function ProductCard({ p }) {
  return (
    <Link to={`/products/${p.id}`} className="card group hover:border-brand-800/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <div className="h-48 bg-gray-800 overflow-hidden">
        {p.image_url
          ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
          : <div className="w-full h-full flex items-center justify-center text-5xl text-gray-600">📦</div>}
      </div>
      <div className="p-4">
        <p className="text-xs text-brand-400 mb-1">{p.category_name||'General'}</p>
        <h3 className="font-display font-semibold line-clamp-1 mb-1 text-sm">{p.name}</h3>
        <p className="text-xs text-gray-500 mb-3">by {p.seller_name}</p>
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg">${p.price}</span>
          <span className={`badge text-xs ${p.stock===0?'bg-red-900/40 text-red-400':'bg-green-900/40 text-green-400'}`}>
            {p.stock===0?'Out of stock':`${p.stock} left`}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search:'', category:'', min_price:'', max_price:'', condition:'', ordering:'-created_at' })
  const [searchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const q = searchParams.get('search') || ''
    if (q) setFilters(f => ({...f, search: q}))
  }, [searchParams])

  useEffect(() => {
    api.get('/api/categories/').then(r => setCategories(r.data.results || r.data)).catch(()=>{})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.search) params.append('search', filters.search)
    if (filters.category) params.append('category', filters.category)
    if (filters.min_price) params.append('min_price', filters.min_price)
    if (filters.max_price) params.append('max_price', filters.max_price)
    if (filters.condition) params.append('condition', filters.condition)
    if (filters.ordering) params.append('ordering', filters.ordering)
    api.get(`/api/products/?${params}`)
      .then(r => setProducts(r.data.results || r.data))
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }, [filters])

  const clearFilters = () => setFilters({ search:'', category:'', min_price:'', max_price:'', condition:'', ordering:'-created_at' })

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">All Products</h1>
            <p className="text-gray-500 text-sm mt-1">{products.length} items available</p>
          </div>
          <button onClick={()=>setShowFilters(!showFilters)} className="flex items-center gap-2 btn-secondary text-sm py-2">
            <SlidersHorizontal size={15}/> Filters
          </button>
        </div>

        {/* Search + Filters */}
        <div className="card p-5 mb-8">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
              <input className="input pl-10" placeholder="Search products..." value={filters.search}
                onChange={e=>setFilters({...filters,search:e.target.value})}/>
            </div>
            <select className="input max-w-[180px]" value={filters.ordering} onChange={e=>setFilters({...filters,ordering:e.target.value})}>
              <option value="-created_at">Newest First</option>
              <option value="price">Price: Low-High</option>
              <option value="-price">Price: High-Low</option>
              <option value="-views_count">Most Popular</option>
            </select>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/5">
              <div>
                <label className="label">Category</label>
                <select className="input text-sm" value={filters.category} onChange={e=>setFilters({...filters,category:e.target.value})}>
                  <option value="">All Categories</option>
                  {categories.map(c=><option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Condition</label>
                <select className="input text-sm" value={filters.condition} onChange={e=>setFilters({...filters,condition:e.target.value})}>
                  <option value="">Any</option>
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>
              <div>
                <label className="label">Min Price ($)</label>
                <input className="input text-sm" type="number" placeholder="0" value={filters.min_price}
                  onChange={e=>setFilters({...filters,min_price:e.target.value})}/>
              </div>
              <div>
                <label className="label">Max Price ($)</label>
                <input className="input text-sm" type="number" placeholder="999" value={filters.max_price}
                  onChange={e=>setFilters({...filters,max_price:e.target.value})}/>
              </div>
              <button onClick={clearFilters} className="col-span-full flex items-center gap-1.5 text-sm text-gray-500 hover:text-white mt-1">
                <X size={14}/> Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-800"/>
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-800 rounded w-1/3"/>
                  <div className="h-4 bg-gray-800 rounded w-3/4"/>
                  <div className="h-3 bg-gray-800 rounded w-1/2"/>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-display font-semibold">No products found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} p={p}/>)}
          </div>
        )}
      </div>
    </div>
  )
}
