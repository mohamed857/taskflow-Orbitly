// Renders a task's labels as small colored chips. `labels` is an array of
// { id, name, color } as returned by the backend inside a task.
export default function LabelChips({ labels, className = '' }) {
  if (!labels || labels.length === 0) return null
  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {labels.map((l) => (
        <span
          key={l.id}
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium border leading-none"
          style={{ color: l.color, borderColor: `${l.color}55`, backgroundColor: `${l.color}1a` }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: l.color }} />
          {l.name}
        </span>
      ))}
    </div>
  )
}
