export default function Button({ children, variant = 'primary', size = 'md', className = '', disabled, loading, onClick, type = 'button', ...props }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 focus:ring-slate-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-400',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-400',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-2.5 text-base gap-2',
  };
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  );
}
