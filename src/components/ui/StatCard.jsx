export default function StatCard({ title, value, icon: Icon, color = 'indigo', change, subtitle }) {
  const colors = {
    indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-100 text-indigo-600', text: 'text-indigo-600' },
    green: { bg: 'bg-green-50', icon: 'bg-green-100 text-green-600', text: 'text-green-600' },
    yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-600', text: 'text-yellow-600' },
    red: { bg: 'bg-red-50', icon: 'bg-red-100 text-red-600', text: 'text-red-600' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-600' },
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600', text: 'text-blue-600' },
  };
  const c = colors[color] || colors.indigo;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start gap-4`}>
      <div className={`p-3 rounded-xl ${c.icon} shrink-0`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value ?? '—'}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        {change !== undefined && (
          <p className={`text-xs mt-1 font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '▲' : '▼'} {Math.abs(change)}% from last month
          </p>
        )}
      </div>
    </div>
  );
}
