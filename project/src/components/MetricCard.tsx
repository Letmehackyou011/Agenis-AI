import { Activity, Cpu, HardDrive, Network } from 'lucide-react';

interface MetricCardProps {
  type: 'cpu' | 'memory' | 'network';
  value: number;
  isAnomaly: boolean;
}

export function MetricCard({ type, value, isAnomaly }: MetricCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'cpu':
        return <Cpu className="w-6 h-6" />;
      case 'memory':
        return <HardDrive className="w-6 h-6" />;
      case 'network':
        return <Network className="w-6 h-6" />;
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'cpu':
        return 'CPU Usage';
      case 'memory':
        return 'Memory Usage';
      case 'network':
        return 'Network Traffic';
    }
  };

  const getColor = () => {
    if (isAnomaly) return 'border-red-500 bg-red-500/10';
    if (value > 80) return 'border-amber-500 bg-amber-500/10';
    return 'border-emerald-500 bg-emerald-500/10';
  };

  const getTextColor = () => {
    if (isAnomaly) return 'text-red-400';
    if (value > 80) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className={`border rounded-lg p-6 ${getColor()} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className={getTextColor()}>
          {getIcon()}
        </div>
        {isAnomaly && (
          <div className="flex items-center gap-1 text-red-400 animate-pulse">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-semibold">ANOMALY</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-white/60">{getLabel()}</h3>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${getTextColor()}`}>
            {value.toFixed(1)}
          </span>
          <span className="text-lg text-white/40">
            {type === 'network' ? 'MB/s' : '%'}
          </span>
        </div>
      </div>
      <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            isAnomaly ? 'bg-red-500' : value > 80 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(100, type === 'network' ? (value / 1000) * 100 : value)}%` }}
        />
      </div>
    </div>
  );
}
