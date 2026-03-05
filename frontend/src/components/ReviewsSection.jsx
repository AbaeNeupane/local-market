import { useState, useEffect } from 'react'
import api from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import StarRating from './StarRating'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'

function RatingBar({ label, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-gray-400">{label}</span>
      <span className="text-yellow-400 text-sm">★</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }}/>
      </div>
      <span className="w-4 text-gray-500 text-right">{count}</span>
    </div>
  )
}

export default function ReviewsSection({ productId }) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ rating: 0, title: '', body: '' })
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const load = async () => {
    try {
      const [reviewsRes, summaryRes] = await Promise.all([
        api.get(`/api/products/${productId}/reviews/`),
        api.get(`/api/products/${productId}/rating/`)
      ])
      setReviews(reviewsRes.data.results || reviewsRes.data)
      setSummary(summaryRes.data)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [productId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.rating === 0) { toast.error('Please select a rating'); return }
    if (!form.body.trim()) { toast.error('Please write a review'); return }
    setSubmitting(true)
    try {
      await api.post(`/api/products/${productId}/reviews/`, form)
      toast.success('Review submitted!')
      setForm({ rating: 0, title: '', body: '' })
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit review')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (reviewId) => {
    if (!confirm('Delete your review?')) return
    try {
      await api.delete(`/api/reviews/${reviewId}/`)
      toast.success('Review deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  if (loading) return <div className="animate-pulse h-32 bg-white/5 rounded-2xl"/>

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Reviews & Ratings</h2>

      {/* Summary */}
      {summary && (
        <div className="card p-5 flex gap-8">
          <div className="text-center shrink-0">
            <p className="text-5xl font-display font-bold">{summary.average}</p>
            <StarRating value={Math.round(summary.average)} size={18}/>
            <p className="text-xs text-gray-500 mt-1">{summary.total} reviews</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5,4,3,2,1].map(n => (
              <RatingBar key={n} label={n} count={summary.breakdown[String(n)] || 0} total={summary.total}/>
            ))}
          </div>
        </div>
      )}

      {/* Write review button */}
      {summary?.can_review && !showForm && (
        <button onClick={() => setShowForm(true)} className="btn-primary">
          ✍️ Write a Review
        </button>
      )}

      {/* Review form */}
      {showForm && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Your Review</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Rating *</label>
              <StarRating value={form.rating} onChange={r => setForm({...form, rating: r})} size={28}/>
            </div>
            <div>
              <label className="label">Title</label>
              <input className="input" placeholder="Summarize your experience"
                value={form.title} onChange={e => setForm({...form, title: e.target.value})}/>
            </div>
            <div>
              <label className="label">Review *</label>
              <textarea className="input min-h-[100px] resize-y" placeholder="Share your experience with this product..."
                value={form.body} onChange={e => setForm({...form, body: e.target.value})} required/>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p className="text-3xl mb-2">💬</p>
          <p className="text-sm">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-800 flex items-center justify-center font-bold text-sm">
                    {r.reviewer_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{r.reviewer_name}</p>
                    <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} size={14}/>
                  {user?.username === r.reviewer_name && (
                    <button onClick={() => handleDelete(r.id)} className="text-gray-600 hover:text-red-400 ml-2 transition-colors">
                      <Trash2 size={14}/>
                    </button>
                  )}
                </div>
              </div>
              {r.title && <p className="font-semibold text-sm mb-1">{r.title}</p>}
              <p className="text-gray-400 text-sm leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}