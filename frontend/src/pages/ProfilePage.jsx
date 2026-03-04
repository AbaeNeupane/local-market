import { useState } from 'react'
import api from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { User, Camera } from 'lucide-react'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    bio: user?.profile?.bio || '',
    phone: user?.profile?.phone || '',
    city: user?.profile?.city || '',
    country: user?.profile?.country || 'Nepal',
    address: user?.profile?.address || '',
  })
  const [avatar, setAvatar] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const data = new FormData()
    Object.entries(form).forEach(([k,v]) => data.append(k, v))
    if (avatar) data.append('avatar', avatar)
    try {
      const res = await api.patch('/api/auth/profile/', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      updateUser(res.data)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl font-bold mb-8">My Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="card p-6 flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-brand-800 flex items-center justify-center overflow-hidden">
                {user?.profile?.avatar
                  ? <img src={user.profile.avatar} className="w-full h-full object-cover"/>
                  : <User size={32} className="text-brand-400"/>}
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-brand-500 transition-colors">
                <Camera size={14}/>
                <input type="file" accept="image/*" className="hidden" onChange={e=>setAvatar(e.target.files[0])}/>
              </label>
            </div>
            <div>
              <p className="font-bold">{user?.username}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="badge bg-brand-900/40 text-brand-400 mt-1">{user?.profile?.user_type}</span>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-display font-semibold">Personal Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">First Name</label><input className="input" value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})}/></div>
              <div><label className="label">Last Name</label><input className="input" value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})}/></div>
            </div>
            <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
            <div><label className="label">Phone</label><input className="input" placeholder="+977 98XXXXXXXX" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
            <div><label className="label">Bio</label><textarea className="input min-h-[80px] resize-y" placeholder="Tell buyers about yourself..." value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/></div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-display font-semibold">Location</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">City</label><input className="input" placeholder="Kathmandu" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></div>
              <div><label className="label">Country</label><input className="input" value={form.country} onChange={e=>setForm({...form,country:e.target.value})}/></div>
            </div>
            <div><label className="label">Address</label><textarea className="input" placeholder="Street address..." value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 justify-center flex">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
