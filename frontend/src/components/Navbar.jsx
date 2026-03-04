import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShoppingBag, Store, User, LogOut, LayoutDashboard, Plus, Menu, X, Search } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [search, setSearch] = useState('')

  const handleLogout = () => { logout(); navigate('/') }
  const handleSearch = (e) => { e.preventDefault(); navigate(`/products?search=${search}`) }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-16 gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl shrink-0">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Store size={16} />
          </div>
          <span className="text-white">Local<span className="text-brand-400">Market</span></span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-10 py-2 text-sm"
              placeholder="Search products, sellers..."
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Link to="/products" className="hidden md:flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2">
            <ShoppingBag size={16}/> Shop
          </Link>

          {user ? (
            <>
              {user.profile?.user_type === 'seller' && (
                <Link to="/products/add" className="hidden md:flex btn-primary text-sm py-2 items-center gap-1.5">
                  <Plus size={15}/> Add Product
                </Link>
              )}
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 transition-all"
                >
                  <div className="w-7 h-7 bg-brand-700 rounded-lg flex items-center justify-center text-xs font-bold">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-medium">{user.username}</span>
                </button>
                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-52 card shadow-xl shadow-black/40 overflow-hidden py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-white/5">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-semibold">{user.username}</p>
                      <span className="badge bg-brand-900 text-brand-300 mt-1">{user.profile?.user_type}</span>
                    </div>
                    <Link to="/dashboard" onClick={() => setDropOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                      <LayoutDashboard size={15}/> Dashboard
                    </Link>
                    <Link to="/profile" onClick={() => setDropOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                      <User size={15}/> Profile
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                      <LogOut size={15}/> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="btn-secondary text-sm py-2">Login</Link>
              <Link to="/register" className="btn-primary text-sm py-2">Sign Up</Link>
            </div>
          )}

          <button className="md:hidden ml-1 p-2 text-gray-400" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-gray-950 px-4 py-3 flex flex-col gap-2">
          <form onSubmit={handleSearch} className="flex gap-2 mb-2">
            <input value={search} onChange={e=>setSearch(e.target.value)} className="input text-sm py-2" placeholder="Search..."/>
            <button className="btn-primary py-2 px-3"><Search size={16}/></button>
          </form>
          <Link to="/products" onClick={()=>setMenuOpen(false)} className="text-sm text-gray-300 hover:text-white py-2">Shop</Link>
          {user && <Link to="/dashboard" onClick={()=>setMenuOpen(false)} className="text-sm text-gray-300 hover:text-white py-2">Dashboard</Link>}
          {user?.profile?.user_type === 'seller' && <Link to="/products/add" onClick={()=>setMenuOpen(false)} className="text-sm text-brand-400 py-2">+ Add Product</Link>}
        </div>
      )}
    </nav>
  )
}
