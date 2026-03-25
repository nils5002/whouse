interface StatusBadgeProps {
  status?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#facc15',
  running: '#22c55e',
  awaiting_2fa: '#f97316',
  failed: '#ef4444',
  completed: '#38bdf8',
  stopped: '#94a3b8',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) {
    return null;
  }
  const key = status.toLowerCase();
  const color = STATUS_COLORS[key] ?? '#a855f7';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        backgroundColor: `${color}1a`,
        color,
        padding: '0.25rem 0.65rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ width: '0.45rem', height: '0.45rem', backgroundColor: color, borderRadius: '999px' }} />
      {status}
    </span>
  );
}
