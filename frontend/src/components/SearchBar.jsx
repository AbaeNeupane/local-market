import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../hooks/useApi'
import { Search, X } from 'lucide-react'

export default function SearchBar({ className = '' }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)
  const navigate = useNavigate()

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); setOpen(false); return }
    clearTimeout(debounceRef.current)
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/api/products/?search=${encodeURIComponent(query)}&page_size=5`)
        const results = res.data.results || res.data
        setSuggestions(results.slice(0, 5))
        setOpen(true)
      } catch { setSuggestions([]) }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  const handleSelect = (product) => {
    setQuery('')
    setSuggestions([])
    setOpen(false)
    navigate(`/products/${product.id}`)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setOpen(false)
    navigate(`/products?search=${encodeURIComponent(query)}`)
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          className="input pl-10 pr-9 py-2 text-sm"
          placeholder="Search products, sellers..."
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setSuggestions([]); setOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            <X size={14}/>
          </button>
        )}
      </form>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 card shadow-2xl shadow-black/50 overflow-hidden z-50">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 animate-pulse">Searching...</div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">No results for "{query}"</div>
          ) : (
            <>
              {suggestions.map(p => (
                <button key={p.id} onClick={() => handleSelect(p)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left">
                  <div className="w-9 h-9 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                    {p.image_url
                      ? <img src={p.image_url} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center text-sm">📦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">by {p.seller_name} · ${p.price}</p>
                  </div>
                </button>
              ))}
              <button onClick={handleSubmit}
                className="w-full px-4 py-2.5 text-xs text-brand-400 hover:bg-white/5 border-t border-white/5 text-left transition-colors">
                See all results for "{query}" →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}