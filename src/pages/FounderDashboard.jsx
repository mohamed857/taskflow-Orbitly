import { useEffect, useState, useCallback } from 'react'
import { Loader2, Building2, Users, Network, BadgeDollarSign, Wallet, CreditCard } from 'lucide-react'
import { admin as adminApi } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import StatCard from '../components/StatCard.jsx'

const fmt = (n) => Number(n || 0).toLocaleString('en-US')

// Platform dashboard: companies, users, and subscription-derived revenue.
export default function FounderDashboard() {
  const { push } = useToast()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setStats(await adminApi.stats())
    } catch (err) {
      push(err.message || 'Could not load stats.', 'error')
    } finally {
      setLoading(false)
    }
  }, [push])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="glass-panel p-12 text-center border border-panelBorder/60">
        <Loader2 size={24} className="animate-spin text-accent mx-auto mb-2" />
        <p className="font-mono text-xs text-fog">Loading dashboard…</p>
      </div>
    )
  }
  if (!stats) return null

  const maxCompanies = Math.max(1, ...stats.plans.map((p) => p.companies))

  return (
    <div className="space-y-6">
      {/* Top metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Companies" value={fmt(stats.totalCompanies)} icon={Building2} color="#0F9B8E" />
        <StatCard label="Users" value={fmt(stats.totalUsers)} icon={Users} color="#6366F1" />
        <StatCard label="Teams" value={fmt(stats.totalTeams)} icon={Network} color="#8B5CF6" />
        <StatCard label="Paying companies" value={fmt(stats.payingCompanies)} icon={CreditCard} color="#F59E0B" />
        <StatCard
          label="Est. MRR (USD)"
          value={`$${fmt(stats.mrrUsd)}`}
          subvalue="/mo"
          icon={BadgeDollarSign}
          color="#10B981"
        />
        <StatCard
          label="Est. MRR (EGP)"
          value={`${fmt(stats.mrrEgp)}`}
          subvalue={`ج.م/mo · $1=${stats.usdToEgp}`}
          icon={Wallet}
          color="#10B981"
        />
      </div>

      {/* Per-plan breakdown */}
      <div className="glass-panel overflow-hidden border border-panelBorder/80">
        <div className="px-5 py-4 border-b border-panelBorder/60">
          <h3 className="font-display text-sm font-bold text-paper">Subscriptions by plan</h3>
          <p className="text-[11px] font-mono text-fog mt-0.5">
            Revenue is the subscription estimate (members × per-user price). A real gateway comes in Phase 4.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[620px] text-left">
            <thead>
              <tr className="border-b border-panelBorder/80 bg-panelAlt/30 text-fog font-mono uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Companies</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Price/user</th>
                <th className="px-4 py-3">MRR (USD)</th>
                <th className="px-4 py-3 w-40">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panelBorder/40">
              {stats.plans.map((p) => (
                <tr key={p.key} className="hover:bg-panelAlt/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-paper font-semibold">{p.name}</span>
                    <span className="text-fog font-mono text-[10px] ml-1.5">{p.key}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-paper">{fmt(p.companies)}</td>
                  <td className="px-4 py-3 font-mono text-fog">{fmt(p.users)}</td>
                  <td className="px-4 py-3 font-mono text-fog">${p.monthlyUsdPerUser}</td>
                  <td className="px-4 py-3 font-mono text-completed">${fmt(p.mrrUsd)}</td>
                  <td className="px-4 py-3">
                    <div className="h-2 rounded-full bg-panelAlt overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${Math.round((p.companies / maxCompanies) * 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
