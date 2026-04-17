import type { ReactNode, ComponentType } from 'react';

interface StatCardProps {
  icon: ComponentType<{ size: number; className?: string }>;
  label: string;
  value: string | number;
  trend: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
    gradient: 'from-blue-500/20 to-blue-500/5'
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: 'text-green-400',
    gradient: 'from-green-500/20 to-green-500/5'
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: 'text-purple-400',
    gradient: 'from-purple-500/20 to-purple-500/5'
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: 'text-orange-400',
    gradient: 'from-orange-500/20 to-orange-500/5'
  }
};

export default function StatCard({ icon: Icon, label, value, trend, color }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={`${colors.bg} border ${colors.border} rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-2">{label}</p>
          <p className="text-3xl font-bold group-hover:text-white transition">{value}</p>
          <p className="text-xs text-slate-500 mt-2 group-hover:text-slate-400 transition">{trend}</p>
        </div>
        <div className={`${colors.bg} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
          <Icon size={24} className={colors.icon} />
        </div>
      </div>
      <div className={`h-1 bg-gradient-to-r ${colors.gradient} rounded-full mt-4`}></div>
    </div>
  );
}
