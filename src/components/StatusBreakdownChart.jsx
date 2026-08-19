import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useChartColors } from '../utils/chartColors.js'

const STATUS_CONFIG = {
  PENDING: { color: '#E8A33D', label: 'Pending' },
  IN_PROGRESS: { color: '#4C7BF3', label: 'In Progress' },
  COMPLETED: { color: '#3FB68B', label: 'Completed' },
  OVERDUE: { color: '#D64545', label: 'Overdue' }
}

export default function StatusBreakdownChart({ tasks = [] }) {
  const c = useChartColors()

  const counts = tasks.reduce((acc, t) => {
    if (!t?.status) return acc
    const statusKey = String(t.status).toUpperCase()
    acc[statusKey] = (acc[statusKey] ?? 0) + 1
    return acc
  }, {})

  const data = Object.entries(counts).map(([status, value]) => ({
    name: status,
    label: STATUS_CONFIG[status]?.label ?? status,
    value
  }))

  const totalTasks = tasks.length

  if (data.length === 0 || totalTasks === 0) {
    return (
      <div className="h-56 flex items-center justify-center select-none">
        <p className="text-sm text-fog font-mono">no task data available</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[224px] select-none">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            stroke="none"
            isAnimationActive={true}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={STATUS_CONFIG[entry.name]?.color ?? '#8B94A3'}
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              backgroundColor: c.panel,
              borderColor: c.panelBorder,
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            itemStyle={{ color: c.paper }}
            formatter={(value, name) => [
              `${value} (${((value / totalTasks) * 100).toFixed(0)}%)`,
              name
            ]}
          />

          <Legend
            verticalAlign="bottom"
            height={28}
            formatter={(value) => (
              <span className="text-fog text-xs font-mono font-medium hover:text-paper transition-colors">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center Metric Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-7">
        <span className="font-display text-xl font-bold text-paper leading-none">
          {totalTasks}
        </span>
        <span className="font-mono text-[10px] text-fog uppercase tracking-wider mt-0.5">
          Tasks
        </span>
      </div>
    </div>
  )
}