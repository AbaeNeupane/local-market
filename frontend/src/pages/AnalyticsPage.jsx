import { useState, useEffect } from 'react'
import api from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { TrendingUp, Package, DollarSign, ShoppingBag } from 'lucide-react'

const PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
]

function MiniChart({ data }) {
  if (!data || data.length === 0) return (
    <div className="h-32 flex items-center justify-center text-gray-600 text-sm">No data yet</div>
  )
  const maxRev = Math.max(...data.map(d => d.revenue), 1)
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full bg-brand-700 hover:bg-brand-500 rounded-t transition-all cursor-default"
            style={{ height: `${(d.revenue / maxRev) * 100}%`, minHeight: d.revenue > 0 ? 4 : 0 }}
          />
          {/* Tooltip */}
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 border border-white/10 rounded-lg px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            <p className="font-semibold">${d.revenue.toFixed(2)}</p>
            <p className="text-gray-400">{d.orders} orders</p>
            <p className="text-gray-500">{d.date}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState('30d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/api/dashboard/analytics/?period=${period}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/dashboard" className="text-sm text-gray-500 hover:text-white">← Dashboard</Link>
            <h1 className="font-display text-3xl font-bold mt-2">Sales Analytics</h1>
          </div>
          {/* Period selector */}
          <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p.value ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse"/>)}
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-8">
              <div className="card p-5 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-brand-900/40"><TrendingUp size={20} className="text-brand-400"/></div>
                <div>
                  <p className="text-2xl font-display font-bold">{data?.summary?.orders || 0}</p>
                  <p className="text-gray-400 text-sm">Orders this period</p>
                </div>
              </div>
              <div className="card p-5 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-green-900/40"><DollarSign size={20} className="text-green-400"/></div>
                <div>
                  <p className="text-2xl font-display font-bold">${(data?.summary?.revenue || 0).toFixed(2)}</p>
                  <p className="text-gray-400 text-sm">Revenue earned</p>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="card p-5 mb-6">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-400"/> Revenue Over Time
              </h3>
              <MiniChart data={data?.sales_over_time}/>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                {data?.sales_over_time?.length > 0 && (
                  <>
                    <span>{data.sales_over_time[0]?.date}</span>
                    <span>{data.sales_over_time[data.sales_over_time.length - 1]?.date}</span>
                  </>
                )}
              </div>
            </div>

            {/* Top Products */}
            <div className="card p-5">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Package size={18} className="text-accent-400"/> Top Products
              </h3>
              {data?.top_products?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">No sales yet</p>
              ) : (
                <div className="space-y-3">
                  {data?.top_products?.map((p, i) => (
                    <Link key={p.id} to={`/products/${p.id}`}
                      className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold
                        ${i===0?'bg-yellow-900/50 text-yellow-400':i===1?'bg-gray-700 text-gray-300':'bg-gray-800 text-gray-500'}`}>
                        {i+1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.total_sold} sold · {p.stock} in stock</p>
                      </div>
                      <p className="font-bold text-green-400 text-sm">${p.total_revenue.toFixed(2)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}