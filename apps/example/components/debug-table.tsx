export interface DebugRow {
  name: string
  uses: number
  lastSeenMs: number | null
}

export function DebugTable({ rows }: { rows: DebugRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-1 text-xs uppercase tracking-wider text-fg-muted">
          <tr>
            <th className="px-4 py-2 font-medium">action</th>
            <th className="px-4 py-2 font-medium">uses</th>
            <th className="px-4 py-2 font-medium">last seen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row) => (
            <tr key={row.name} className="bg-surface-1/50">
              <td className="px-4 py-2 font-mono text-xs">{row.name}</td>
              <td className={`px-4 py-2 font-semibold ${row.uses === 0 ? 'text-fg-muted' : 'text-fg'}`}>
                {row.uses}
              </td>
              <td className="px-4 py-2 text-xs text-fg-muted">
                {row.lastSeenMs === null ? '—' : new Date(row.lastSeenMs).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
