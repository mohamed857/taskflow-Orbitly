import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { useState } from 'react'
import { useChartColors } from '../utils/chartColors.js'

export default function AssigneeLoadChart({ tasks = [] }) {
  const c = useChartColors()
  const [activeIndex, setActiveIndex] = useState(null)

  const counts = tasks.reduce((acc, t) => {
    const name = t.assignee?.username ?? 'Unassigned'
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {})

  const data = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  if (data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center border border-dashed border-panelBorder/60 rounded-xl">
        <p className="text-xs text-fog font-mono">No tasks assigned yet</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <BarChart 
        data={data} 
        margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
        onMouseLeave={() => setActiveIndex(null)}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={c.panelBorder} vertical={false} opacity={0.5} />
        <XAxis 
          dataKey="name" 
          tick={{ fill: c.fog, fontSize: 11 }} 
          axisLine={{ stroke: c.panelBorder }} 
          tickLine={false}
          dy={4}
        />
        <YAxis 
          allowDecimals={false} 
          tick={{ fill: c.fog, fontSize: 11 }} 
          axisLine={false} 
          tickLine={false} 
        />
        <Tooltip
          content={<CustomTooltip colors={c} />}
          cursor={{ fill: c.panelAlt, opacity: 0.4 }}
        />
        <Bar 
          dataKey="count" 
          radius={[6, 6, 0, 0]}
          maxBarSize={38}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={c.accent}
              opacity={activeIndex === null || activeIndex === index ? 1 : 0.65}
              onMouseEnter={() => setActiveIndex(index)}
              className="transition-opacity duration-150 cursor-pointer"
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function CustomTooltip({ active, payload, label, colors }) {
  if (!active || !payload?.length) return null

  return (
    <div 
      className="p-2.5 rounded-lg shadow-lg backdrop-blur-md border border-panelBorder/80 space-y-0.5"
      style={{ backgroundColor: `${colors.panel}E6` }}
    >
      <p className="text-xs font-semibold text-paper font-display">{label}</p>
      <p className="text-xs text-fog font-mono">
        <span className="font-bold text-accent">{payload[0].value}</span> {payload[0].value === 1 ? 'task' : 'tasks'}
      </p>
    </div>
  )
}