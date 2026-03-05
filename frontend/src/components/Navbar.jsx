import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SearchBar from './SearchBar'
import { Menu, X, LayoutDashboard, User, LogOut, Plus, BarChart2, CreditCard } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const isSeller = user?.profile?.user_type === 'seller'

  const handleLogout = () => { logout(); navigate('/'); setDropOpen(false) }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="font-display font-bold text-xl shrink-0 bg-gradient-to-r from-brand-400 to-pink-400 bg-clip-text text-transparent">
          🏪 LocalMarket
        </Link>

        {/* Search — hidden on mobile */}
        <div className="flex-1 max-w-sm hidden md:block">
          <SearchBar/>
        </div>

        <div className="flex-1 md:flex-none"/>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/products" className="text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all">Shop</Link>
          {isSeller && (
            <Link to="/products/add" className="btn-primary text-sm py-2 flex items-center gap-1.5">
              <Plus size={15}/> Add Product
            </Link>
          )}
          {user ? (
            <div className="relative">
              <button onClick={() => setDropOpen(!dropOpen)}
                className="flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10">
                <div className="w-7 h-7 rounded-lg bg-brand-700 flex items-center justify-center text-sm font-bold">
                  {user.username?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium max-w-[80px] truncate">{user.username}</span>
              </button>
              {dropOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 card shadow-2xl shadow-black/50 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="font-semibold text-sm">{user.username}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.profile?.user_type}</p>
                  </div>
                  {[
                    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                    ...(isSeller ? [
                      { to: '/analytics', icon: BarChart2, label: 'Analytics' },
                      { to: '/dashboard/stripe', icon: CreditCard, label: 'Stripe Setup' },
                    ] : []),
                    { to: '/profile', icon: User, label: 'Profile' },
                  ].map(item => (
                    <Link key={item.to} to={item.to} onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors">
                      <item.icon size={15} className="text-gray-500"/>
                      {item.label}
                    </Link>
                  ))}
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 transition-colors border-t border-white/5">
                    <LogOut size={15}/> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="btn-secondary text-sm py-2">Login</Link>
              <Link to="/register" className="btn-primary text-sm py-2">Sign Up</Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-400 hover:text-white">
          {menuOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-gray-950 px-4 py-4 space-y-3">
          <SearchBar/>
          <Link to="/products" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-300">Shop</Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-300">Dashboard</Link>
              {isSeller && <>
                <Link to="/analytics" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-300">Analytics</Link>
                <Link to="/products/add" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-300">Add Product</Link>
              </>}
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-300">Profile</Link>
              <button onClick={handleLogout} className="block py-2 text-sm text-red-400">Logout</button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary flex-1 text-center text-sm py-2">Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 text-center text-sm py-2">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}