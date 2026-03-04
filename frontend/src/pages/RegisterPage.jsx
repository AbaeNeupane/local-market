import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Store, ShoppingBag, Tag } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', first_name: '', last_name: '', password: '', password2: '', user_type: 'buyer' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password2) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      await api.post('/api/auth/register/', form)
      await login(form.username, form.password)
      toast.success('Account created! Welcome to Local Market!')
      navigate('/dashboard')
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        Object.values(errors).flat().forEach(e => toast.error(e))
      } else {
        toast.error('Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-900/20 via-gray-950 to-gray-950 pointer-events-none"/>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-display font-bold text-2xl mb-4">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center"><Store size={20}/></div>
            <span>Local<span className="text-brand-400">Market</span></span>
          </Link>
          <h1 className="font-display text-3xl font-bold">Create Account</h1>
          <p className="text-gray-500 mt-2">Join the local marketplace</p>
        </div>

        {/* Account Type */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { value: 'buyer', label: 'Buyer', desc: 'Browse & buy', icon: <ShoppingBag size={20}/> },
            { value: 'seller', label: 'Seller', desc: 'List products', icon: <Tag size={20}/> },
          ].map(t => (
            <button key={t.value} type="button" onClick={() => setForm({...form, user_type: t.value})}
              className={`p-4 rounded-xl border text-left transition-all ${form.user_type===t.value ? 'border-brand-500 bg-brand-900/30 text-white' : 'border-white/10 bg-white/3 text-gray-400 hover:border-white/20'}`}>
              <div className={`mb-2 ${form.user_type===t.value?'text-brand-400':'text-gray-500'}`}>{t.icon}</div>
              <div className="font-semibold text-sm">{t.label}</div>
              <div className="text-xs opacity-70">{t.desc}</div>
            </button>
          ))}
        </div>

        <div className="card p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name</label>
                <input className="input" placeholder="John" value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})}/>
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input" placeholder="Doe" value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})}/>
              </div>
            </div>
            <div>
              <label className="label">Username *</label>
              <input className="input" placeholder="johndoe" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required/>
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" placeholder="john@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
            </div>
            <div>
              <label className="label">Password *</label>
              <input className="input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={6}/>
            </div>
            <div>
              <label className="label">Confirm Password *</label>
              <input className="input" type="password" placeholder="Repeat password" value={form.password2} onChange={e=>setForm({...form,password2:e.target.value})} required/>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 justify-center flex text-base mt-2">
              {loading ? <span className="animate-pulse">Creating...</span> : `Create ${form.user_type.charAt(0).toUpperCase()+form.user_type.slice(1)} Account`}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account? <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
