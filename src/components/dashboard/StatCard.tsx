import type { ComponentType, SVGProps } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
  accent?: string;
}

/** Compact metric card used across the dashboard summary row. */
export function StatCard({ label, value, sublabel, Icon, accent }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </span>
        {Icon && (
          <span style={{ color: accent ?? '#22c55e' }}>
            <Icon width={18} height={18} />
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      {sublabel && <div className="text-xs text-slate-400">{sublabel}</div>}
    </div>
  );
}
