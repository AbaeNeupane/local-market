import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../hooks/useApi'
import toast from 'react-hot-toast'
import { Upload, ArrowLeft } from 'lucide-react'

export default function AddProductPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ name:'', description:'', price:'', stock:'1', condition:'new', category:'' })
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/api/categories/').then(r => setCategories(r.data.results || r.data))
    if (isEdit) {
      api.get(`/api/products/${id}/`).then(r => {
        const p = r.data
        setForm({ name:p.name, description:p.description, price:p.price, stock:p.stock, condition:p.condition, category:p.category?.id||'' })
        if (p.image_url) setPreview(p.image_url)
      })
    }
  }, [id])

  const handleImage = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setImage(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const data = new FormData()
    Object.entries(form).forEach(([k,v]) => v && data.append(k, v))
    if (image) data.append('image', image)
    try {
      if (isEdit) {
        await api.patch(`/api/products/${id}/`, data, { headers:{'Content-Type':'multipart/form-data'} })
        toast.success('Product updated!')
      } else {
        await api.post('/api/products/', data, { headers:{'Content-Type':'multipart/form-data'} })
        toast.success('Product listed successfully!')
      }
      navigate('/dashboard')
    } catch (err) {
      const errors = err.response?.data
      if (errors) Object.values(errors).flat().forEach(e => toast.error(e))
      else toast.error('Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={()=>navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6">
          <ArrowLeft size={16}/> Back
        </button>
        <h1 className="font-display text-3xl font-bold mb-8">{isEdit ? 'Edit Product' : 'List a Product'}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="label">Product Image *</label>
            <label className="block cursor-pointer">
              <div className={`border-2 border-dashed rounded-2xl overflow-hidden transition-colors ${preview?'border-brand-700':'border-white/10 hover:border-white/20'}`}>
                {preview
                  ? <img src={preview} className="w-full h-56 object-cover"/>
                  : <div className="h-56 flex flex-col items-center justify-center gap-3 text-gray-500">
                      <Upload size={32}/>
                      <p className="text-sm">Click to upload image</p>
                      <p className="text-xs">PNG, JPG up to 10MB</p>
                    </div>
                }
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImage}/>
            </label>
          </div>

          <div className="card p-6 space-y-4">
            <div>
              <label className="label">Product Name *</label>
              <input className="input" placeholder="e.g. iPhone 14 Pro Max" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea className="input min-h-[100px] resize-y" placeholder="Describe your product in detail..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Price (USD) *</label>
                <input className="input" type="number" min="0.01" step="0.01" placeholder="0.00" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required/>
              </div>
              <div>
                <label className="label">Stock Quantity *</label>
                <input className="input" type="number" min="0" placeholder="1" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} required/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Condition</label>
                <select className="input" value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})}>
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  <option value="">Select category</option>
                  {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-4 justify-center flex text-base">
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'List Product for Sale'}
          </button>
        </form>
      </div>
    </div>
  )
}
