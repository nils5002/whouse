import { useEffect, useRef } from 'react';

interface JobLogProps {
  logs: string[];
}

export function JobLog({ logs }: JobLogProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ref = containerRef.current;
    if (ref) {
      ref.scrollTop = ref.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      ref={containerRef}
      style={{
        background: 'rgba(15,23,42,0.85)',
        color: '#e2e8f0',
        borderRadius: '12px',
        padding: '1rem',
        height: '320px',
        overflowY: 'auto',
        border: '1px solid rgba(148, 163, 184, 0.25)',
        boxShadow: 'inset 0 0 0 1px rgba(148, 163, 184, 0.15)',
      }}
    >
      {logs.length === 0 ? (
        <div style={{ opacity: 0.6 }}>Noch keine Ausgaben.</div>
      ) : (
        <pre
          style={{
            margin: 0,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: '0.78rem',
            whiteSpace: 'pre-wrap',
          }}
        >
          {logs.join('\n')}
        </pre>
      )}
    </div>
  );
}
