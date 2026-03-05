export default function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}

export function statusBadge(status) {
  const map = {
    ACTIVE: 'success', APPROVED: 'success', PAID: 'success', PRESENT: 'success',
    PENDING: 'warning', DRAFT: 'warning', PROCESSING: 'info',
    REJECTED: 'danger', FAILED: 'danger', TERMINATED: 'danger', ABSENT: 'danger',
    CANCELLED: 'default', EXITED: 'default',
    ON_HOLD: 'purple', HALF_DAY: 'warning', WORK_FROM_HOME: 'info',
    NOTICE_PERIOD: 'warning', RESIGNATION_SUBMITTED: 'warning',
  };
  return map[status] || 'default';
}
