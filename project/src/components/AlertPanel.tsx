import { AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { Incident } from '../types';

interface AlertPanelProps {
  incidents: Incident[];
}

export function AlertPanel({ incidents }: AlertPanelProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected':
        return 'bg-red-500/20 border-red-500 text-red-400';
      case 'healing':
        return 'bg-amber-500/20 border-amber-500 text-amber-400';
      case 'recovered':
        return 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
      case 'failed':
        return 'bg-red-700/20 border-red-700 text-red-300';
      default:
        return 'bg-gray-500/20 border-gray-500 text-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-amber-400';
      case 'low':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'detected':
        return <AlertTriangle className="w-5 h-5" />;
      case 'healing':
        return <Activity className="w-5 h-5 animate-pulse" />;
      case 'recovered':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const activeIncidents = incidents.filter(i => ['detected', 'healing'].includes(i.status));
  const resolvedIncidents = incidents.filter(i => ['recovered', 'failed'].includes(i.status));

  return (
    <div className="space-y-4">
      {activeIncidents.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">Active Alerts</h3>
          {activeIncidents.map((incident) => (
            <div
              key={incident.id}
              className={`border rounded-lg p-4 ${getStatusColor(incident.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(incident.status)}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold capitalize">{incident.status}</span>
                      <span className={`text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                        [{incident.severity.toUpperCase()}]
                      </span>
                    </div>
                    <p className="text-sm opacity-90">{incident.description}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {new Date(incident.detected_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolvedIncidents.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Recent History</h3>
          {resolvedIncidents.slice(0, 3).map((incident) => (
            <div
              key={incident.id}
              className={`border rounded-lg p-3 ${getStatusColor(incident.status)} opacity-60`}
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(incident.status)}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm capitalize">{incident.status}</span>
                    <span className={`text-xs ${getSeverityColor(incident.severity)}`}>
                      [{incident.severity}]
                    </span>
                  </div>
                  <p className="text-xs opacity-80">{incident.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {incidents.length === 0 && (
        <div className="text-center py-8 text-white/40">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">All systems operational</p>
        </div>
      )}
    </div>
  );
}
