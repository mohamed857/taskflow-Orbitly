import { useEffect, useState, useCallback } from 'react'
import { Loader2, Save, DollarSign, RefreshCw } from 'lucide-react'
import { admin as adminApi } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'

// Super-admin editor for live, DB-driven plan pricing: per-plan monthly USD
// price and the global USD→EGP conversion rate. Yearly = 10 months (2 free)
// and EGP figures are derived on the server, so only these inputs are edited.
export default function FounderPricing() {
  const { push } = useToast()
  const [rows, setRows] = useState([])
  const [rate, setRate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const cfg = await adminApi.pricing()
      setRows((cfg.plans || []).map((p) => ({ ...p, monthlyUsd: String(p.monthlyUsd) })))
      setRate(String(cfg.usdToEgp ?? ''))
    } catch (err) {
      push(err.message || 'Could not load pricing.', 'error')
    } finally {
      setLoading(false)
    }
  }, [push])

  useEffect(() => {
    load()
  }, [load])

  const setPrice = (key, value) =>
    setRows((r) => r.map((row) => (row.key === key ? { ...row, monthlyUsd: value.replace(/[^\d]/g, '') } : row)))

  const save = async () => {
    const prices = {}
    for (const row of rows) {
      const n = parseInt(row.monthlyUsd, 10)
      if (!Number.isNaN(n) && n >= 0) prices[row.key] = n
    }
    const r = parseFloat(rate)
    const payload = { prices }
    if (!Number.isNaN(r) && r > 0) payload.usdToEgp = r
    setSaving(true)
    try {
      const cfg = await adminApi.updatePricing(payload)
      setRows((cfg.plans || []).map((p) => ({ ...p, monthlyUsd: String(p.monthlyUsd) })))
      setRate(String(cfg.usdToEgp ?? ''))
      push('Pricing updated. Live for all workspaces.', 'success')
    } catch (err) {
      push(err.message || 'Could not update pricing.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const rateNum = parseFloat(rate) || 0
  const preview = (usd) => {
    const n = parseInt(usd, 10)
    if (Number.isNaN(n)) return { yearly: 0, mEgp: 0, yEgp: 0 }
    const yearly = n * 10
    return { yearly, mEgp: Math.round(n * rateNum), yEgp: Math.round(yearly * rateNum) }
  }

  if (loading) {
    return (
      <div className="glass-panel p-12 text-center border border-panelBorder/60">
        <Loader2 size={24} className="animate-spin text-accent mx-auto mb-2" />
        <p className="font-mono text-xs text-fog">Loading pricing…</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* USD → EGP rate */}
      <div className="glass-panel p-5 border border-panelBorder/80">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw size={15} className="text-accent" />
          <h3 className="font-display text-sm font-bold text-paper">USD → EGP rate</h3>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <input
              inputMode="decimal"
              value={rate}
              onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ''))}
              className="input-field w-40 py-2 text-sm font-mono"
              placeholder="48"
            />
          </div>
          <p className="text-xs text-fog font-mono">
            $1 = {rateNum || '—'} EGP · {'يُطبَّق تلقائيًا على كل الأسعار بالجنيه'}
          </p>
        </div>
      </div>

      {/* Per-plan monthly USD */}
      <div className="glass-panel overflow-hidden border border-panelBorder/80">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-panelBorder/60">
          <DollarSign size={15} className="text-accent" />
          <h3 className="font-display text-sm font-bold text-paper">Monthly price per plan (USD / user)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-panelBorder/80 bg-panelAlt/30 text-fog font-mono uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Limits</th>
                <th className="px-4 py-3">Monthly USD</th>
                <th className="px-4 py-3">Yearly USD</th>
                <th className="px-4 py-3">Monthly EGP</th>
                <th className="px-4 py-3">Yearly EGP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panelBorder/40">
              {rows.map((row) => {
                const pv = preview(row.monthlyUsd)
                return (
                  <tr key={row.key} className="hover:bg-panelAlt/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-paper font-semibold">{row.name}</p>
                      <p className="text-fog font-mono text-[10px]">{row.key}</p>
                    </td>
                    <td className="px-4 py-3 text-fog font-mono text-[11px]">
                      {row.maxMembers < 0 ? '∞' : row.maxMembers} members · {row.maxTeams < 0 ? '∞' : row.maxTeams} teams
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-fog font-mono">$</span>
                        <input
                          inputMode="numeric"
                          value={row.monthlyUsd}
                          onChange={(e) => setPrice(row.key, e.target.value)}
                          className="input-field w-20 py-1.5 text-sm font-mono"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-fog">${pv.yearly}</td>
                    <td className="px-4 py-3 font-mono text-fog">{pv.mEgp.toLocaleString('en-US')}</td>
                    <td className="px-4 py-3 font-mono text-fog">{pv.yEgp.toLocaleString('en-US')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] text-fog/70 font-mono">
          Yearly = 10× monthly (2 months free). EGP is derived from the rate above. Changes apply live for every workspace.
        </p>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save pricing
        </button>
      </div>
    </div>
  )
}
