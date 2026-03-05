export default function Table({ columns, data, loading, emptyMessage = 'No data found' }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead>
          <tr className="bg-slate-50">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Loading...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
