export default function Input({ label, error, className = '', required, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={`block w-full px-3 py-2 text-sm border rounded-lg shadow-sm transition-colors
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          ${error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'}
          disabled:bg-slate-50 disabled:text-slate-400 ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', required, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`block w-full px-3 py-2 text-sm border rounded-lg shadow-sm transition-colors
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          ${error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'}
          disabled:bg-slate-50 disabled:text-slate-400 ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', required, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={3}
        className={`block w-full px-3 py-2 text-sm border rounded-lg shadow-sm transition-colors resize-none
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          ${error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'}
          disabled:bg-slate-50 disabled:text-slate-400 ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
