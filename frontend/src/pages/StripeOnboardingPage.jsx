import { useState, useEffect } from 'react'
import api from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { CreditCard, ExternalLink, CheckCircle, AlertCircle, Loader, RefreshCw, Unlink } from 'lucide-react'

function StatusBadge({ enabled, label }) {
  return enabled
    ? <span className="flex items-center gap-1.5 text-sm text-green-400"><CheckCircle size={14}/>{label}: Active</span>
    : <span className="flex items-center gap-1.5 text-sm text-yellow-400"><AlertCircle size={14}/>{label}: Pending</span>
}

export default function StripeOnboardingPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchStatus = async () => {
    try {
      const res = await api.get('/api/stripe/connect/status/')
      setStatus(res.data)
    } catch { toast.error('Could not load Stripe status') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchStatus() }, [])

  const handleConnect = async () => {
    setActionLoading(true)
    try {
      // Step 1: create account if not exists
      if (!status?.stripe_account_id) {
        await api.post('/api/stripe/connect/create/', { country: user?.profile?.country === 'Nepal' ? 'NP' : 'US' })
      }
      // Step 2: get onboarding link
      const res = await api.post('/api/stripe/connect/onboarding/')
      window.location.href = res.data.onboarding_url
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start onboarding')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDashboard = async () => {
    setActionLoading(true)
    try {
      const res = await api.post('/api/stripe/connect/dashboard/')
      window.open(res.data.url, '_blank')
    } catch { toast.error('Could not open Stripe dashboard') }
    finally { setActionLoading(false) }
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect your Stripe account? You will stop receiving payments.')) return
    setActionLoading(true)
    try {
      await api.post('/api/stripe/connect/disconnect/')
      toast.success('Stripe account disconnected')
      fetchStatus()
    } catch { toast.error('Disconnect failed') }
    finally { setActionLoading(false) }
  }

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <Loader className="animate-spin text-brand-400" size={32}/>
    </div>
  )

  const fullySetup = status?.charges_enabled && status?.payouts_enabled

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-white">← Dashboard</Link>
          <h1 className="font-display text-3xl font-bold mt-4">Stripe Payments Setup</h1>
          <p className="text-gray-400 mt-2">Connect your bank account to receive payments from buyers directly.</p>
        </div>

        {/* Status Card */}
        <div className={`card p-6 mb-6 border ${fullySetup ? 'border-green-800/40' : 'border-yellow-800/30'}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${fullySetup ? 'bg-green-900/40' : 'bg-yellow-900/30'}`}>
                  <CreditCard size={20} className={fullySetup ? 'text-green-400' : 'text-yellow-400'}/>
                </div>
                <div>
                  <p className="font-semibold">{status?.connected ? 'Stripe Account Connected' : 'No Stripe Account'}</p>
                  {status?.stripe_account_id && <p className="text-xs text-gray-500 font-mono">{status.stripe_account_id}</p>}
                </div>
              </div>

              {status?.connected && (
                <div className="space-y-1 ml-1">
                  <StatusBadge enabled={status.charges_enabled} label="Accept Payments"/>
                  <StatusBadge enabled={status.payouts_enabled} label="Receive Payouts"/>
                  <StatusBadge enabled={status.details_submitted} label="Details Submitted"/>
                </div>
              )}
            </div>
            <button onClick={fetchStatus} className="text-gray-500 hover:text-white p-2 rounded-lg hover:bg-white/5">
              <RefreshCw size={16}/>
            </button>
          </div>

          {status?.requirements?.currently_due?.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800/30 rounded-xl">
              <p className="text-yellow-400 text-sm font-semibold mb-1">⚠️ Action Required</p>
              <p className="text-yellow-300/70 text-xs">Stripe requires additional information before you can receive payments.</p>
            </div>
          )}
        </div>

        {/* How It Works */}
        {!fullySetup && (
          <div className="card p-6 mb-6">
            <h3 className="font-display font-semibold mb-4">How It Works</h3>
            <div className="space-y-3">
              {[
                { step: '1', title: 'Connect Your Account', desc: 'Click below and complete Stripe\'s secure onboarding form.' },
                { step: '2', title: 'Verify Identity', desc: 'Stripe will verify your ID and bank account. Takes 1–2 minutes.' },
                { step: '3', title: 'Start Earning', desc: 'Buyers pay, Stripe takes 10% platform fee, you receive the rest automatically.' },
              ].map(s => (
                <div key={s.step} className="flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-brand-800 text-brand-300 flex items-center justify-center text-sm font-bold shrink-0">{s.step}</div>
                  <div>
                    <p className="font-medium text-sm">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commission Info */}
        <div className="card p-5 mb-6 bg-brand-950/40 border border-brand-900/30">
          <p className="text-sm font-semibold text-brand-300 mb-2">💰 Payout Structure</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-lg font-bold">$100</p><p className="text-xs text-gray-500">Sale Price</p></div>
            <div><p className="text-lg font-bold text-red-400">-$10</p><p className="text-xs text-gray-500">Platform Fee</p></div>
            <div><p className="text-lg font-bold text-green-400">$90</p><p className="text-xs text-gray-500">Your Payout</p></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {!fullySetup ? (
            <button onClick={handleConnect} disabled={actionLoading} className="btn-primary py-4 flex items-center justify-center gap-2 text-base">
              {actionLoading ? <Loader className="animate-spin" size={18}/> : <CreditCard size={18}/>}
              {status?.connected ? 'Continue Onboarding →' : 'Connect Stripe Account →'}
            </button>
          ) : (
            <button onClick={handleDashboard} disabled={actionLoading} className="btn-primary py-4 flex items-center justify-center gap-2">
              <ExternalLink size={16}/>
              Open Stripe Dashboard
            </button>
          )}

          {status?.connected && (
            <button onClick={handleDisconnect} disabled={actionLoading}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-red-900/40 text-red-400 hover:bg-red-900/20 transition-all text-sm">
              <Unlink size={15}/> Disconnect Account
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
